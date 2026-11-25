// Animations du site Stégéas : déclenchement au défilement.
// Le script de tête pose html.anim ; s'il n'est pas là, rien ne se passe.
(() => {
  const racine = document.documentElement;
  window.__animPret = true;
  if (!racine.classList.contains('anim')) return;

  try {
    // Ordre d'apparition : dans un même lot d'éléments qui entrent ensemble à l'écran,
    // chacun reçoit son rang (--i), pour une cascade qui marche en 3 colonnes comme en 1.
    const surVue = (elements, quandVisible, options = {}) => {
      const obs = new IntersectionObserver(entrees => {
        entrees
          .filter(e => e.isIntersecting)
          .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .forEach((e, rang) => {
            obs.unobserve(e.target);
            quandVisible(e.target, rang);
          });
      }, { threshold: options.seuil ?? 0.2, rootMargin: '0px 0px -8% 0px' });
      elements.forEach(el => obs.observe(el));
    };

    // 2. Cartes de services et icônes tracées
    const cartes = [...document.querySelectorAll('.cards .card')];
    cartes.forEach(carte => {
      carte.querySelectorAll('.card__icon svg > *').forEach((trait, j) => {
        let longueur = 0;
        try { longueur = trait.getTotalLength(); } catch { /* forme non mesurable : on la laisse pleine */ }
        if (longueur > 0) {
          trait.style.setProperty('--l', Math.ceil(longueur) + 1);
          trait.style.setProperty('--j', j);
          trait.classList.add('trait');
        }
      });
    });
    surVue(cartes, (carte, rang) => {
      carte.style.setProperty('--i', rang);
      carte.classList.add('vu');
    });

    // 3. Photo du cabinet : on l'enveloppe pour que le rideau suive ses coins arrondis
    const visuel = document.querySelector('.about__visual');
    const photo = visuel && visuel.querySelector('.about__photo');
    if (photo) {
      const rideau = document.createElement('span');
      rideau.className = 'anim-rideau';
      photo.before(rideau);
      rideau.append(photo);
      surVue([visuel], el => el.classList.add('vu'), { seuil: 0.35 });
    }

    // 4. Compteurs : « +30 » et « 100% » défilent depuis 0 ; les petits nombres restent fixes
    const compteurs = [...document.querySelectorAll('.why-item__num')]
      .map(el => {
        const m = el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/);
        return m && +m[2] >= 10 ? { el, avant: m[1], fin: +m[2], apres: m[3] } : null;
      })
      .filter(Boolean);
    compteurs.forEach(c => {
      c.el.setAttribute('aria-label', c.avant + c.fin + c.apres);
      c.el.textContent = c.avant + '0' + c.apres;
    });
    surVue(compteurs.map(c => c.el), el => {
      const c = compteurs.find(x => x.el === el);
      const duree = 1400;
      const debut = performance.now();
      const pas = t => {
        const p = Math.min(1, (t - debut) / duree);
        const adouci = 1 - Math.pow(2, -10 * p); // départ vif, arrivée douce
        el.textContent = c.avant + Math.round(c.fin * (p === 1 ? 1 : adouci)) + c.apres;
        if (p < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }, { seuil: 0.6 });
  } catch (erreur) {
    // Au moindre problème, on rend la page telle quelle plutôt que de laisser du contenu caché
    racine.classList.remove('anim');
    console.error('Animations désactivées :', erreur);
  }
})();
