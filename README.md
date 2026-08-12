# Mon Launcher

Launcher personnel statique qui réunit les applications, jeux et outils publiés sur Vercel.

Le catalogue public contient au moins **118 applications**, dont au moins **105 jeux**. Les totaux peuvent évoluer automatiquement lorsque de nouvelles entrées sont ajoutées.

Version publique : [launcher-applications.vercel.app](https://launcher-applications.vercel.app/)

## Version 1.4

La version 1.4 ajoute quatre fonctions de pilotage :

- des filtres de disponibilité **Tous**, **Disponible**, **En préparation** et **Nouveauté** (45 derniers jours), combinables avec la recherche, les catégories, les genres et les tags ;
- un journal visible des versions, alimenté par `assets/catalogue-updates.js` ;
- un tableau de santé qui contrôle les liens publics et les médias du catalogue, avec actualisation manuelle ;
- une synchronisation GitHub/Vercel des jeux en préparation, exécutée automatiquement toutes les six heures ou manuellement, puis proposée exclusivement par pull request.

## Fonctionnalités

- catalogue visuel avec recherche tolérante aux accents, catégories et tags ;
- navigation Jeux à deux niveaux : **Jeux originaux** ou **Fan games**, puis huit genres ;
- franchise ou jeu de base indiqué pour chaque fan-game ;
- états de publication explicites `upcoming` et `published`, avec date d’ajout ISO ;
- favoris, tri par nom ou popularité, sélection aléatoire et mode vitrine ;
- mode édition pour les personnalisations locales ;
- migration des champs officiels de publication sans écraser les autres personnalisations enregistrées ;
- navigation clavier, raccourci `Ctrl+K`, états accessibles et mise en page responsive ;
- installation PWA légère, shell hors ligne et cache progressif des médias consultés.

Les personnalisations restent dans le `localStorage` du navigateur. Elles ne modifient pas automatiquement le catalogue suivi dans Git.

## Organisation des jeux

Chaque jeu est classé sous `Jeux → Jeux originaux` ou `Jeux → Fan games`, puis dans un genre principal : Action & tir, Stratégie & tactique, Gestion & simulation, Survie & horreur, RPG & progression, Rythme & arcade, Aventure & exploration ou Puzzle & cartes.

Les fan-games conservent leur franchise ou jeu de base dans `baseGame`, afin que ce rattachement soit visible et recherchable. AnotherDay’Z est explicitement un jeu original.

## Lancer localement

Depuis la racine du dépôt :

    py -m http.server 8000 --bind 127.0.0.1

Puis ouvrir `http://127.0.0.1:8000`.

## Vérifier le projet

    npm test

L’audit valide la syntaxe, les identifiants et URL, la taxonomie, les états de publication, les dates d’ajout, le journal SemVer, tous les aperçus et présentations, les galeries (au moins cinq vues), les icônes, le manifeste, le service worker et le contrat de synchronisation. Il vérifie aussi que le shell PWA reste inférieur à 5 Mo.

Pour simuler la détection sans écrire :

    npm run sync:check

Pour appliquer localement les promotions vérifiées :

    npm run sync:upcoming

## Synchronisation des jeux en préparation

La liste blanche se trouve dans `assets/upcoming-games.json`. Chaque entrée déclare un identifiant de catalogue, les dépôts GitHub autorisés, les projets Vercel autorisés et les URL publiques candidates.

La synchronisation est **fail-closed** : elle ne publie rien si une preuve manque. Une promotion exige simultanément :

- un dépôt GitHub existant, non archivé, appartenant au propriétaire configuré et possédant un commit sur sa branche par défaut ;
- un projet Vercel réellement lié à ce même dépôt et au même identifiant de dépôt ;
- un déploiement de production `READY`, promu et doté d’un alias ;
- une URL HTTPS candidate qui répond correctement ;
- une modification limitée aux champs `link`, `status` et `releaseState` de l’entrée déjà autorisée.

Si les jetons ou identifiants requis sont absents, le script ignore la synchronisation sans modifier le catalogue. Un dépôt ou déploiement absent laisse le jeu en `upcoming`. Le workflow n’écrit jamais directement sur `main` : après audit, il crée ou actualise une pull request dédiée.

### Configuration GitHub Actions requise

- secret `VERCEL_TOKEN` : jeton Vercel autorisé à lire les projets et déploiements ;
- secret facultatif `CATALOG_GITHUB_TOKEN` : jeton GitHub de lecture des dépôts suivis ; à défaut, `GITHUB_TOKEN` est utilisé ;
- variable `VERCEL_TEAM_ID` : identifiant d’équipe Vercel ;
- variable `CATALOG_GITHUB_OWNER` : propriétaire GitHub attendu.

Le fichier `assets/upcoming-games.json` fournit également des valeurs par défaut contrôlées pour le propriétaire et l’équipe. Les secrets ne doivent jamais être ajoutés au dépôt.

## Ajouter une application au catalogue partagé

1. Ajouter son objet dans `starterApps` dans `index.html`, ou dans `assets/recent-games.js`, avec un `id` unique.
2. Renseigner `releaseState` (`upcoming` ou `published`) et `addedAt` au format ISO. Une entrée `published` doit avoir un lien ; une entrée `upcoming` ne doit pas en inventer.
3. Pour un jeu, renseigner `gameKind`, l’un des huit `genre` et, pour un fan-game, `baseGame`.
4. Ajouter un aperçu et une présentation distincte sous `assets/previews/` et `assets/presentations/`.
5. Ajouter au moins cinq vues sous `assets/screenshots/<id>/` et les référencer dans `assets/app-gallery.json`.
6. Ajouter le symbole `icon-<id>` dans `assets/app-icons.svg`.
7. Ajouter la version correspondante à `assets/catalogue-updates.js`, dans l’ordre décroissant des dates.
8. Incrémenter `CACHE_NAME` dans `sw.js` si le shell change, puis exécuter `npm test` et vérifier le rendu desktop/mobile.

Le mode édition sert uniquement aux personnalisations locales. Une entrée publique doit être ajoutée au dépôt et validée par la pull request.
