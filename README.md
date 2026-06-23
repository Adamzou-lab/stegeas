# Stégéas

Site vitrine de Stégéas, cabinet de courtage en assurances basé à Toulouse. Site statique multi-pages présentant le cabinet, ses offres pour les particuliers et les professionnels, et ses coordonnées.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Page d'accueil |
| `cabinet.html` | Présentation du cabinet |
| `particuliers.html` | Offres pour les particuliers |
| `professionnels.html` | Offres pour les professionnels |
| `visa-schengen.html` | Assurance visa Schengen |
| `contact.html` | Formulaire et coordonnées |
| `mentions-legales.html` | Mentions légales |

## Stack

- HTML, CSS et JavaScript, sans framework
- `assets/`, `css/`, `js/` : ressources statiques
- `robots.txt` et `sitemap.xml` pour le référencement

## Développement local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Déploiement

Le script `deploy.sh` envoie le site statique vers le serveur de production.

## Auteur

Adam (Adamzou-lab).
