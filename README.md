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
- installation PWA et consultation hors ligne du catalogue.

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

L'audit valide la syntaxe JavaScript, les identifiants et URL du catalogue, les aperçus, les métadonnées et les fichiers PWA. Le même contrôle s'exécute sur GitHub Actions à chaque push et pull request vers `main`.

## Ajouter une application au catalogue partagé

1. Ajouter son objet dans `starterApps` dans `index.html` avec un `id` unique.
2. Ajouter son aperçu PNG sous `assets/previews/`.
3. Ajouter cet aperçu à `APP_SHELL` dans `sw.js`, puis incrémenter `CACHE_NAME`.
4. Exécuter `npm run audit` et vérifier le rendu desktop/mobile.

Le mode édition de l'interface sert aux personnalisations locales. Pour publier une entrée à tous les visiteurs, elle doit être ajoutée au dépôt.
