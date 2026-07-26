# Mon Launcher

Launcher personnel statique qui réunit mes applications, jeux et outils publiés sur Vercel.

Version publique : [launcher-applications.vercel.app](https://launcher-applications.vercel.app/)

## Fonctionnalités

- catalogue visuel avec recherche tolérante aux accents, catégories et tags ;
- favoris, tri, sélection aléatoire et mode vitrine ;
- mode édition pour ajouter ou modifier des entrées locales ;
- migration du catalogue : les nouvelles applications officielles sont ajoutées sans écraser les personnalisations enregistrées ;
- validation des liens et images avant stockage ;
- navigation clavier, raccourci `Ctrl+K`, états accessibles et mise en page responsive ;
- installation PWA légère, avec shell hors ligne et mise en cache progressive des médias consultés.

Les personnalisations restent dans le `localStorage` du navigateur. Elles ne modifient pas automatiquement le catalogue suivi dans Git.

## Lancer localement

Depuis la racine du dépôt :

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8000`.

## Vérifier le projet

```powershell
npm run audit
```

L'audit valide la syntaxe JavaScript, les identifiants et URL du catalogue, les aperçus, les présentations, les galeries, les formats binaires, les icônes, les métadonnées et les fichiers PWA. Il limite aussi la taille du shell préchargé afin que l'installation ne dépende pas du téléchargement atomique de tous les médias. Le même contrôle s'exécute sur GitHub Actions à chaque push et pull request vers `main`.

## Ajouter une application au catalogue partagé

1. Ajouter son objet dans `starterApps` dans `index.html` avec un `id` unique.
2. Ajouter son aperçu JPEG, PNG ou WebP sous `assets/previews/` avec une extension fidèle au format réel, et sa présentation sous `assets/presentations/` (ou réutiliser explicitement l'aperçu).
3. Ajouter cinq vues à `assets/screenshots/<id>/` et référencer la galerie dans `assets/app-gallery.json`.
4. Ajouter le symbole `icon-<id>` dans `assets/app-icons.svg`.
5. Incrémenter `CACHE_NAME` dans `sw.js` si le shell applicatif change ; les médias sont mis en cache à la demande.
6. Exécuter `npm run audit` et vérifier le rendu desktop/mobile.

Le mode édition de l'interface sert aux personnalisations locales. Pour publier une entrée à tous les visiteurs, elle doit être ajoutée au dépôt.
