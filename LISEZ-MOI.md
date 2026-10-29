# Site Roicab : mode d'emploi

Site statique : aucun serveur, aucune base de données. Tout le contenu est dans `data.js`.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique (accueil, projets, CV, contact) |
| `style.css` | Apparence |
| `app.js` | Affichage des pages |
| `data.js` | **Ton contenu** : profil, compétences, projets, CV |
| `cv/` | Tes CV en PDF |
| `assets/photo.jpg` | Ta photo |

Pour voir le site chez toi, double-clique sur `index.html`.

## Modifier le site depuis le site (sans toucher aux fichiers)

En bas de chaque page, clique sur **Espace propriétaire**. Tu te connectes une seule fois avec un jeton GitHub (explications sur la page de connexion). Ensuite, des boutons apparaissent partout, visibles de toi seul :

- **+ Ajouter un projet (avec sa documentation)** : tu remplis le projet, tu joins le fichier de documentation (PDF, Word…), tu choisis « En cours » ou « Terminé ».
- Sur chaque projet : **+ Ajouter une documentation**, **Modifier**, **Supprimer**, **Marquer terminé / Remettre en cours**, et les mêmes boutons pour chaque documentation.
- Page **Documentation** : toutes les documentations, filtrables par état.
- Page **CV** : ajoute une nouvelle version, définis laquelle est l'actuelle, supprime les anciennes.
- Page d'accueil : **Modifier le profil, la photo et les compétences**.

Les visiteurs voient un bouton **Télécharger** sur chaque documentation et chaque CV. Chaque enregistrement met le site à jour en 1 à 2 minutes.

### Créer le jeton GitHub (une seule fois)
1. GitHub > photo de profil > **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**.
2. **Repository access** : « Only select repositories » > ton dépôt `roicab`.
3. **Permissions > Repository permissions > Contents** : « Read and write ».
4. Génère, copie le jeton et colle-le sur la page de connexion du site, avec ton pseudo GitHub et le nom du dépôt.

Le jeton reste dans ton navigateur uniquement. Ne le partage à personne et déconnecte-toi sur un ordinateur qui n'est pas le tien. Le mode édition ne fonctionne que sur le site publié (GitHub Pages ou ton domaine), pas en ouvrant `index.html` depuis ton ordinateur.

## Modifier à la main (alternative)

Tu peux aussi modifier `data.js` directement sur GitHub (crayon, puis Commit). Les fichiers sont dans les dossiers `docs/` et `cv/`.

## Mettre en ligne avec ton domaine (GitHub Pages, gratuit)

1. Crée un compte sur github.com, puis un dépôt public nommé `roicab`.
2. Clique sur **Add file > Upload files**, glisse **tout le contenu** de ce dossier (y compris `cv/` et `assets/`), puis **Commit**.
3. Dans **Settings > Pages**, choisis la branche `main` et le dossier `/ (root)`, puis **Save**. Le site apparaît sur `https://TON-PSEUDO.github.io/roicab/`.
4. Pour modifier ensuite : ouvre `data.js` sur GitHub, clique sur le crayon, change le texte, **Commit**. Pour un CV : **Add file > Upload files** dans le dossier `cv/`.

### Brancher un nom de domaine

1. Achète un domaine chez un registrar (OVH, Gandi, Namecheap, etc.), par exemple `roicab.fr` ou `roicab.dev`. Vérifie sa disponibilité, je ne peux pas la garantir.
2. Dans la zone DNS du domaine, ajoute :
   - 4 enregistrements **A** pour `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 enregistrement **CNAME** pour `www` : `TON-PSEUDO.github.io`
3. Dans **Settings > Pages > Custom domain**, saisis ton domaine, puis coche **Enforce HTTPS** quand l'option apparaît (quelques minutes à quelques heures).

Alternative : **Netlify** ou **Cloudflare Pages** permettent de glisser le dossier et de brancher un domaine depuis leur interface.
