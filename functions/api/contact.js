/**
 * Reception du formulaire de contact et relais par email via Resend.
 *
 * Cloudflare Pages sert des fichiers statiques : un POST sur une page HTML
 * repond 405. C'est pour cette raison que le formulaire, ecrit a l'origine
 * pour Netlify Forms, n'envoyait rien. Cette fonction fournit le point
 * d'entree qui manquait.
 *
 * Variables d'environnement (Cloudflare Pages > Settings > Environment variables) :
 *   RESEND_API_KEY  obligatoire, cle API Resend
 *   CONTACT_TO      optionnel, destinataire      (defaut contact@stegeas.fr)
 *   CONTACT_FROM    optionnel, expediteur        (defaut Formulaire Stegeas
 *                                                 <formulaire@send.stegeas.com>)
 */

const DEFAUT_TO = 'contact@stegeas.fr';
const DEFAUT_FROM = 'Formulaire Stégéas <formulaire@send.stegeas.com>';
const MAX_TAILLE = 20000; // octets, garde-fou contre les envois massifs

const json = (statut, corps) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/** Neutralise le HTML avant insertion dans l'email. */
const echapper = (v = '') =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Empeche l'injection d'en-tetes via les champs repris dans le sujet ou le reply-to. */
const uneLigne = (v = '') => String(v).replace(/[\r\n]+/g, ' ').trim();

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, erreur: 'methode non autorisee' });
  }

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY absente des variables d environnement');
    return json(500, { ok: false, erreur: 'configuration' });
  }

  // 1. Lecture du corps, en JSON comme en formulaire classique
  let data;
  try {
    const brut = await request.text();
    if (brut.length > MAX_TAILLE) return json(413, { ok: false, erreur: 'trop volumineux' });

    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      data = JSON.parse(brut);
    } else {
      data = Object.fromEntries(new URLSearchParams(brut));
    }
  } catch {
    return json(400, { ok: false, erreur: 'corps illisible' });
  }

  // 2. Piege a robots : un humain ne remplit jamais ce champ cache.
  //    On repond 200 pour ne pas renseigner le spammeur sur la detection.
  if (data['bot-field']) return json(200, { ok: true });

  // 3. Validation
  const nom = uneLigne(data.nom);
  const prenom = uneLigne(data.prenom);
  const email = uneLigne(data.email);
  const tel = uneLigne(data.tel);
  const objet = uneLigne(data.objet);
  const message = String(data.message || '').trim();

  const manquants = [];
  if (!nom) manquants.push('nom');
  if (!email) manquants.push('email');
  if (!message) manquants.push('message');
  if (manquants.length) return json(400, { ok: false, erreur: 'champs manquants', manquants });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { ok: false, erreur: 'email invalide' });
  }

  // 4. Composition du message
  const identite = [prenom, nom].filter(Boolean).join(' ') || nom;
  const lignes = [
    ['Nom', identite],
    ['Email', email],
    ['Téléphone', tel || 'non renseigné'],
    ['Objet', objet || 'non renseigné'],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6">
      <h2 style="margin:0 0 16px;font-size:17px;color:#7B1C2E">Nouveau message depuis stegeas.com</h2>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        ${lignes
          .map(
            ([k, v]) =>
              `<tr><td style="padding:3px 16px 3px 0;color:#6b6b6b">${k}</td>` +
              `<td style="padding:3px 0"><strong>${echapper(v)}</strong></td></tr>`
          )
          .join('')}
      </table>
      <div style="padding:16px;background:#f5f5f3;border-left:3px solid #7B1C2E;white-space:pre-wrap">${echapper(
        message
      )}</div>
      <p style="margin-top:20px;font-size:12px;color:#6b6b6b">
        Répondre à cet email écrira directement à ${echapper(email)}.
      </p>
    </div>`;

  const texte =
    lignes.map(([k, v]) => `${k} : ${v}`).join('\n') + `\n\n${message}\n`;

  // 5. Envoi
  try {
    const reponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAUT_FROM,
        to: [env.CONTACT_TO || DEFAUT_TO],
        reply_to: email,
        subject: objet ? `Site stegeas.com — ${objet}` : `Site stegeas.com — message de ${identite}`,
        html,
        text: texte,
      }),
    });

    if (!reponse.ok) {
      console.error('Resend a repondu', reponse.status, await reponse.text());
      return json(502, { ok: false, erreur: 'envoi impossible' });
    }

    return json(200, { ok: true });
  } catch (e) {
    console.error('Echec de l appel a Resend', e);
    return json(502, { ok: false, erreur: 'envoi impossible' });
  }
}
