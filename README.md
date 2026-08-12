# Mon Launcher

Launcher personnel statique qui réunit mes applications, jeux et outils publiés sur Vercel.

Le catalogue public compte **118 applications**, dont **105 jeux**.

Version publique : [launcher-applications.vercel.app](https://launcher-applications.vercel.app/)

## Fonctionnalités

- catalogue visuel avec recherche tolérante aux accents, catégories et tags ;
- navigation Jeux à deux niveaux : **Jeux originaux** ou **Fan games**, puis huit genres ;
- franchise ou jeu de base indiqué pour chaque fan-game ;
- statut visible « En préparation » pour les jeux catalogués avant leur publication ;
- favoris, tri, sélection aléatoire et mode vitrine ;
- mode édition pour ajouter ou modifier des entrées locales ;
- migration du catalogue : les nouvelles applications officielles sont ajoutées sans écraser les personnalisations enregistrées ;
- validation des liens et images avant stockage ;
- navigation clavier, raccourci `Ctrl+K`, états accessibles et mise en page responsive ;
- installation PWA légère, avec shell hors ligne et mise en cache progressive des médias consultés.

Les personnalisations restent dans le `localStorage` du navigateur. Elles ne modifient pas automatiquement le catalogue suivi dans Git.

## Organisation des jeux

Chaque jeu est classé sous `Jeux → Jeux originaux` ou `Jeux → Fan games`, puis dans un genre principal : Action & tir, Stratégie & tactique, Gestion & simulation, Survie & horreur, RPG & progression, Rythme & arcade, Aventure & exploration ou Puzzle & cartes.

Les fan-games conservent en plus leur franchise ou jeu de base dans `baseGame`, afin que ce rattachement soit visible et recherchable.

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

1. Ajouter son objet dans `starterApps` dans `index.html` avec un `id` unique, ou dans `assets/recent-games.js` pour une nouvelle vague de jeux.
2. Pour un jeu, renseigner `gameKind` (`Jeux originaux` ou `Fan games`) et l'un des huit `genre` disponibles. Un fan-game doit aussi renseigner `baseGame` avec son jeu ou sa franchise de base.
3. Ajouter son aperçu JPEG, PNG ou WebP sous `assets/previews/` avec une extension fidèle au format réel, puis une présentation distincte sous `assets/presentations/`.
4. Ajouter cinq vues à `assets/screenshots/<id>/` et référencer la galerie dans `assets/app-gallery.json`.
5. Ajouter le symbole `icon-<id>` dans `assets/app-icons.svg`.
6. Incrémenter `CACHE_NAME` dans `sw.js` si le shell applicatif change ; les médias sont mis en cache à la demande.
7. Exécuter `npm run audit` et vérifier le rendu desktop/mobile.

Le mode édition de l'interface sert aux personnalisations locales. Pour publier une entrée à tous les visiteurs, elle doit être ajoutée au dépôt.
