# Mon Launcher

Launcher personnel qui réunit les jeux et outils accessibles sur Vercel, ainsi que les jeux indépendants distribués à télécharger depuis GitHub.

La PR #17 propose **157 fiches, dont 144 jeux** ; la version publique peut encore afficher le catalogue historique tant que cette branche n'est pas fusionnée.

Version publique : [launcher-applications.vercel.app](https://launcher-applications.vercel.app/)

## Version candidate 1.14 — Jeux oubliés et titres d'origine

La branche candidate ajoute **17 jeux retrouvés** au catalogue sans supprimer les **140 anciennes fiches** : dix pages Vercel identifiées, cinq jeux distribués localement depuis leurs dépôts GitHub et deux mini-jeux distincts trouvés dans les anthologies d’août. Le total devient **157 applications dont 144 jeux**. Le bouton et le badge distinguent une page Jouer d'une page de téléchargement.

Les jeux nouvellement retrouvés ne reçoivent aucune illustration ni capture de gameplay imaginaire. Deux nouveaux mini-jeux sont distingués des éditions séparées : « DON’T LOOK WHEN THEY SAY SOLEIL » et « Maid Café Simulator Deluxe ». Pour **DEADLINE: Outbreak**, un écran titre réel, un aperçu et cinq captures natives de la mission d'ouverture ont été enregistrés avec leurs SHA-256. **Resident Evil: B.O.W. Protocol** possède lui aussi son écran d'entrée et cinq vraies vues des spécimens Tyrant, Licker et Nemesis, des sept modes et des archives (R20). **Ce ne sont pas des captures de combat animé** ; l'intégrale 1:1 de chaque créature reste non certifiée. **Dernière Ligne — Zéro Repli 0.44.2** a désormais son véritable écran titre, un aperçu de la nuit et **cinq captures natives** (campagnes, préparation, trois phases de combat), enregistrées depuis le fichier HTML local exact du commit `d3d4bb04abea` dans [la preuve native](docs/media-proof/derniere-ligne-local-0442-2026-11-01.json). Quatre autres distributions locales attendent encore leurs captures. **Mass Effect — Relay Chronicles 0.3.0** possède son [véritable écran titre, la Normandy 2D/3D et cinq vues jouées](docs/media-proof/mass-effect-relay-native-2026-11-01.json). **Yu-Gi-Oh! Hologram Duel 2.5D** possède [cinq vues natives vérifiées](docs/media-proof/yugioh-hologram-native-2026-11-01.json) : sélection du deck, campagne solo, Atlas des Terrains, duel compact et Vue Arène (le mode Vue Réelle 3D reste à recapturer). Ces prises de vue n'impliquent pas une fidélité canonique 1:1 des personnages ou monstres ; elles prouvent le rendu des jeux. **RIFTCASTERS 3D — Convergence** a aussi son [jeu WebGL réel et cinq scènes](docs/media-proof/riftcasters-convergence-native-2026-11-01.json) : préparation d'Elias Quill, journal, arène, Égide activée avec consommation effective de mana et pause. **Ragtime Rumble — Complete Tour 3.2.0-alpha.3** possède maintenant [cinq images source-native](docs/media-proof/ragtime-complete-tour-native-2026-11-01.json) : menu, tournée, éditeur, vrai combat contre Maestro Bellows et pause. **80 captures réparties dans 16 galeries** sont désormais documentées, pour 157 fiches ; **10 nouvelles fiches** attendent encore des prises de vue vérifiables. Les anciennes illustrations restent archivées.

[Retrouvailles et doublons vérifiés](docs/RECOVERED_GAMES_2026-11-01.md) · [matrice exhaustive des médias](docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json) · [diagnostic des URLs](docs/LINK_IDENTITY_SSO_2026-11-01.md)

**Important :** la version 1.14 est dans la PR en cours de validation. Tant que la PR n'est pas fusionnée, la production peut afficher une version plus ancienne. Le mode édition local ne possède pas de véritable authentification admin, et les fichiers publics ne deviennent pas confidentiels du seul fait de leur masquage dans l'UI.

---

## Version 1.13 — Actualisation des fiches et séparation des archives (1er novembre 2026)

Cette mise à jour conserve les **140 fiches existantes** et leur historique. Trois adresses publiques ont été **rétablies après vérification du véritable jeu** (Brèche Multiverselle, Vortex Command et PREDATOR: HIVE WARRIORS). L'alias d'équipe de Malaise Party demande une connexion Vercel : ce jeu est désormais indiqué comme protégé, sans prétendre qu'un HTTP 200 signifie qu'il est accessible. Douze descriptions et accroches gagnent en précision diégétique d'après leurs sources GitHub. [Preuves des destinations et de la redirection SSO](docs/LINK_IDENTITY_SSO_2026-11-01.md).

Les **112 illustrations précédentes** ne sont plus chargées ni listées par les galeries publiques : `assets/app-gallery.json` ne conserve que les captures et `assets/app-gallery-admin.json` indexe les anciens visuels, consultables depuis le mode édition local. **Attention : le mode édition n'est pas authentifié, et les fichiers ainsi que le dépôt demeurent publics.** Une véritable exclusivité administrateur nécessitera une authentification et un stockage privé des originaux.

Une [matrice de revue des 157 fiches et galeries](docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json) distingue **non revu**, **à refaire** et **accepté** sans certifier le 1:1 sans preuve. **45 captures sur les 700 historiques** ont été renouvelées sur **neuf galeries originales**, et **dix captures supplémentaires** proviennent de deux nouvelles fiches (DEADLINE et B.O.W. Protocol), soit **55 captures vérifiées au total** (TRIARCHE, DEADWALL, Yautja: Apex Hunt, MOUSTIQUE, WORLD HIVE WARS, Shadow Codec Ops, CainOS, AVP HUNT // HIVE TCG et Vortex Command). Les **655 autres** attendent encore une revue. Les neuf anciennes séries historiques et leurs neuf aperçus ont été archivés ; aucune image d'archive n'a été effacée. Les sources et preuves sont rassemblées dans [l'audit](docs/LAUNCHER_FIDELITY_AUDIT_2026-11-01.md). Les illustrations promotionnelles non vérifiées ne sont pas déclarées « fidèles 1:1 ».

La [réconciliation exhaustive des 172 dépôts GitHub et 162 projets Vercel](docs/GITHUB_ONLY_GAMES_AUDIT_2026-11-01.md) a réintégré **15 jeux auparavant omis** dans une première vague : dix titres web ou réintégrations déployées, plus **cinq éditions à télécharger sur GitHub**. Deux mini-jeux des anthologies d’août ont ensuite été ajoutés séparément (DIVA PULSE, Dernière Ligne, Fallout Marseille — MISTRAL, PARALLAXE — Protocole 9 et Massilia Cyberpunk). Les fiches locales affichent **Fichiers et installation** au lieu de « Ouvrir », et aucun média n'est inventé. Les projets vides, les DLC privés et les environnements de test restent recensés hors du rayon Jeux.

La [correspondance des 13 productions prioritaires avec leur SHA et leur statut](docs/PRODUCTION_DEPLOYMENTS_2026-11-01.md) distingue les builds réellement publiés des sources plus récentes. Les captures MOUSTIQUE comprennent **une vue de vol libre jouable et quatre cadrages de QA du moteur WebGL2**, explicitement étiquetés. WORLD HIVE WARS présente les cinq écrans de campagne `map / colony / defense / squad / codex` depuis une nouvelle partie en **simulation privée**, sans adresse GPS ni sauvegarde préfabriquée ; ce sont des interfaces réelles, pas des combats CONTACT. Shadow Codec Ops présente un tableau natif de **31 missions Side Ops**, et non une scène de combat artificielle : le rendu Phaser headless n'était pas représentatif. CainOS a été photographié après sa calibration réelle, puis Encore montre ses neuf modes, ses 14 combattants, ses douze arènes et une arène de combat correctement cadrée. Les previews et les illustrations ne remplacent jamais une démonstration de l'interface réelle.

Pour contrôler les **157 destinations** (sites publics, dépôts à télécharger et accès SSO) sans modifier les alias à l'aveugle :

    npm run links:check

Le contrôle HTTP est également prévu quotidiennement via GitHub Actions et conserve un rapport en artefact. Il ne certifie pas à lui seul que le lien pointe sur le dernier contenu fonctionnel.

---

## Version 1.12 — Six créations sortent des archives

SCP Foundation: Site Director — Deep Protocol, SOMA//MASSILIA, AVP: HUNT // HIVE TCG, ECHObound, DEADWALL et AZIZ — LA LUMIÈRE DORT rejoignent le launcher après leur séparation en dépôts GitHub et productions Vercel dédiés.

Chaque fiche réunit une présentation originale générée par OpenAI, un aperçu distinct et cinq captures du vrai jeu. Lorsque l’API image_gen ne fournit pas d’identifiant de génération, la provenance associe explicitement le thread Codex source au SHA-256 du fichier local au lieu d’inventer un identifiant.

Le launcher compte désormais **140 applications**, **127 jeux**, **140 aperçus**, **140 présentations OpenAI**, **700 captures de galerie** et **1 092 médias uniques** au total.

---

## Version 1.11 — Quatre archives deviennent quatre mondes jouables
## Version 1.11 — Quatre archives deviennent quatre mondes jouables

ECHO RIFT, OMBRE//GEEK, SON OF A…! — Legacy Forge et VEILBOUND — Les Visages du Monde Brisé rejoignent le launcher après leur séparation en dépôts GitHub et productions Vercel dédiés.

Chaque fiche réunit une présentation originale générée par OpenAI avec sa provenance vérifiable, un aperçu et cinq captures du vrai jeu. Les liens publics ont été contrôlés individuellement, notamment les alias spécifiques d’Echo Rift et de Veilbound.

Le launcher compte désormais **134 applications**, **121 jeux**, **134 aperçus**, **134 présentations OpenAI**, **670 captures de galerie** et **1 050 médias uniques** au total.

---


## Version 1.10 — Quatre créations retrouvent leur vitrine

Jingle Duel, BLACK CASE — Inventory Protocol, VITRINE//VERSE et PIP : Le Trésor des Huit Pattes rejoignent le launcher après leur séparation en projets dédiés.

Chaque fiche réunit une présentation originale générée par OpenAI avec sa provenance vérifiable, un aperçu distinct et cinq captures du vrai jeu. Les publications pointent vers leurs productions Vercel respectives.

Le launcher compte désormais **130 applications**, **117 jeux**, **130 aperçus**, **130 présentations OpenAI**, **650 captures de galerie** et **1 022 médias uniques** au total.

---

## Version 1.9 — Treize jeux disponibles

La vague du 25 août 2026 sépare dans leurs propres dépôts et déploiements sept créations récentes : Backrooms — Liminal Escape, MALAISE PARTY, NEON//CLASH, PLANCK, Nexus of Torment, RIFF//RUSH et SPERM RUSH: Genesis Grand Prix.

Elle ajoute au launcher sept jeux jusque-là absents — les quatre premiers ci-dessus, The House of the Dead 2.5D, GEARSTORM Boss Circuit et ALIENS: Tantalus Frontier — puis publie les six entrées encore marquées en préparation : INTRAVORE, Nexus of Torment, JAWA: The Duskmen, Mecha Overdrive, SPERM RUSH et RIFF//RUSH. L’identifiant historique \`spermatozoid-kart-omega\` est conservé pour ne pas casser les médias et favoris existants, tandis que la fiche affiche le titre canonique SPERM RUSH: Genesis Grand Prix.

Le launcher compte désormais **126 applications**, **113 jeux**, **126 aperçus**, **126 présentations OpenAI** et **630 captures de galerie**.

---


## Version 1.7

La version 1.7 conserve les illustrations OpenAI comme présentations principales et remet à disposition **112 anciens visuels** dans les galeries, sous le libellé **Illustration précédente**. Ces fichiers historiques résident dans `assets/presentations/previous/` et sont référencés par la propriété `previousPresentation` de `assets/app-gallery.json`.

Sept applications n’ont pas d’illustration précédente, car leur visuel OpenAI était déjà leur première présentation : Élyra — Le Grand Pas, INTRAVORE, Nexus of Torment, JAWA: THE DUSKMEN, Mecha Overdrive, Spermatozoid Kart Omega et RIFF//RUSH.

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

L’audit valide la syntaxe, les identifiants et URL, la taxonomie, les états de publication, les dates d’ajout, le journal SemVer, tous les aperçus et présentations, les 112 illustrations précédentes, les galeries (au moins cinq vues), les icônes, le manifeste, le service worker et le contrat de synchronisation. Il contrôle aussi que chaque ancien visuel est unique, lisible et différent de la présentation OpenAI active, que les vingt-huit applications créées sans illustration antérieure sont explicitement identifiées, que le compte média est cohérent et que le shell PWA reste inférieur à 5 Mo.

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
4. Générer une présentation dédiée avec OpenAI `image_gen`, la placer sous `assets/presentations/`, puis enregistrer sa provenance et son SHA-256 dans `assets/openai-art-manifest.json`. Ajouter aussi un aperçu distinct sous `assets/previews/`.
5. Ajouter au moins cinq vues sous `assets/screenshots/<id>/` et les référencer dans `assets/app-gallery-admin.json`. Si l’application remplace une présentation existante, déplacer l’ancien visuel sous `assets/presentations/previous/` et renseigner `previousPresentation` dans l’objet de galerie, à côté de `images`.
6. Ajouter le symbole `icon-<id>` dans `assets/app-icons.svg`.
7. Ajouter la version correspondante à `assets/catalogue-updates.js`, dans l’ordre décroissant des dates.
8. Incrémenter `CACHE_NAME` dans `sw.js` si le shell change, puis exécuter `npm test` et vérifier le rendu desktop/mobile.

Le mode édition sert uniquement aux personnalisations locales. Une entrée publique doit être ajoutée au dépôt et validée par la pull request.
