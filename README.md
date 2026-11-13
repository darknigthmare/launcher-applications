# Mon Launcher

Version du dépôt **1.18.0** · **158 fiches, dont 145 jeux** · [Ouvrir le launcher](https://launcher-applications.vercel.app/)

## Version 1.18 — Hébergements des jeux (13 novembre 2026)

Les cinq projets Vercel sont créés et liés à leurs dépôts. **DIVA PULSE**, **Dernière Ligne** et **Massilia Cyberpunk 0.78** disposent de productions publiques contrôlées : fichiers et empreintes source, parcours natifs dans Chromium, musique ou combat et déplacement réel selon le jeu. Les adresses et les preuves sont suivies dans le [rapport de déploiement](docs/WEB_GAME_DEPLOYMENTS_2026-11-13.md).

Les sources d’hébergement complet de **Fallout Mistral** et de **Parallaxe** sont préparées séparément. Fallout conserve ses données cartographiques ; Parallaxe dispose d’un stockage de salons durable isolé, avec contrôle de révision atomique. **Le quota Hobby Vercel de 100 déploiements par jour bloque leurs nouvelles publications**, ainsi que la nouvelle publication du launcher. La production du launcher reste donc en **1.17** tant que ce quota n’est pas rétabli. Aucun forfait payant n’est activé.

Cette PR prépare les liens web : **Jouer** pour les productions vérifiées ; **Publication en attente** désactivé pour celles qui ne le sont pas. Les anciens liens GitHub enregistrés sont migrés. Les 27 illustrations acceptées, 118 textes diégétiques, galeries natives, favoris et personnalisations sont conservés. Les versions de captures historiques restent distinctes des nouvelles versions hébergées. Cache PWA **shell v34 / médias v5**. [Note de livraison 1.18](docs/RELEASE_1.18.0_2026-11-13.md).

---

## Version 1.17 — Illustrations et récits des jeux (13 novembre 2026)

**27 illustrations générées depuis les vues natives** complètent les 18 jeux retrouvés et les neuf anciennes présentations masquées en attente de revue. Chaque image conserve le style de ses références : pixels, silhouettes 2D, géométrie low-poly, figurines ou interface du jeu. Les captures originales sont conservées ; une illustration générée n’est jamais présentée comme une capture de gameplay.

Les [revues individuelles](docs/illustration-reviews/) enregistrent les prompts, références, SHA et différences. Un [second passage de revue par un agent distinct](docs/ILLUSTRATION_REVIEW_2026-11-13.json) a comparé les 27 images à leurs références. Les recompositions, détails régénérés et microtextes ne sont pas certifiés identiques pixel pour pixel ou canoniques. Le [manifeste dédié](assets/illustration-manifest.json) n’affiche que les illustrations acceptées. Les crédits cartographiques de Massilia restent visibles dans la fiche et la vitrine.

Les textes sont corrigés sur **118 fiches** : 99 du catalogue récent et 19 du catalogue historique intégré. Les descriptions et accroches parlent des lieux, des actions et des enjeux attestés. Les paragraphes de QA, versions, installation, code et certification sont conservés dans les [documents de revue](docs/DIEGETIC_COPY_REVIEW_2026-11-13.md) et les métadonnées de suivi, sans encombrer les descriptions destinées au joueur.

Les jeux web proposent **Jouer**. Une source GitHub n’est plus proposée comme installation ou comme jeu web. Les cinq fiches **DIVA PULSE, Dernière Ligne, Fallout Mistral, Parallaxe et Massilia Cyberpunk** restent dans le filtre **À confirmer**, avec bouton désactivé, tant qu’une véritable adresse de lancement web n’est pas vérifiée. La recherche a couvert 164 projets, 857 alias et 30 variantes de nom ; les domaines homonymes d’autres produits ne sont pas associés à ces jeux. [Preuves de recherche Vercel](docs/VERCEL_LAUNCH_DISCOVERY_2026-11-13.md).

Les galeries natives, favoris, couvertures personnalisées et archives sont préservés. Les illustrations sont chargées depuis leur manifeste vérifié ; une attribution stockée dans le navigateur ne suffit pas à faire approuver une image. Le mode édition expose les informations de provenance et reste sans authentification serveur. Cache PWA **shell v33 / médias v4**.

```sh
npm test
npm run test:browser
npm run links:check
```

La publication utilise le SHA vérifié et son déploiement READY, indiqués dans la PR de livraison. Les **655 captures historiques** non révisées restent suivies dans la matrice ; cette vague ne les requalifie pas automatiquement.

---

## Version 1.16 — Galeries restantes et fiches à jour (9 novembre 2026)

Cette vague ajoute **30 captures natives dans 6 galeries**, avec un écran d’entrée et un aperçu par jeu :

- **DIGITAL CIRCUS — ENCORE** — [preuve native](docs/media-proof/digital-circus-local-070-2026-11-09.json), version 0.7.0.
- **SILENT HILL — HALO OF FLESH** — [preuve native](docs/media-proof/silent-hill-local-070-2026-11-09.json), version 0.7.0.
- **FALLOUT MARSEILLE — MISTRAL** — [preuve native](docs/media-proof/fallout-mistral-local-050-2026-11-09.json), version 0.50.0.
- **MASSILIA CYBERPUNK — MARSEILLE AUGMENTÉE** — [preuve native](docs/media-proof/massilia-cyberpunk-local-076-2026-11-09.json), version 0.76.0.
- **DON’T LOOK WHEN THEY SAY « SOLEIL »** — [preuve native](docs/media-proof/soleil-restored-local-2026-11-09.json), version Collection restaurée août 2026.
- **Maid Café Simulator Deluxe** — [preuve native](docs/media-proof/maid-cafe-restored-local-2026-11-09.json), version Collection restaurée août 2026.

Les captures sont prises dans les moteurs réels. Les sources exactes, versions, scènes, cadrages et empreintes sont enregistrés dans les preuves. Les mini-jeux SOLEIL et Maid Café conservent leur interface 2D minimaliste ; aucun faux écran titre ou décor ne leur est ajouté. Les captures exécutées localement restent identifiées comme telles. Lorsque le jeu n’existe qu’en HTML public autonome, le snapshot exact et son SHA remplacent une révision Git qui n’existe pas.

Le total devient **135 captures documentées dans 27 galeries**. Les 18 fiches retrouvées ont désormais cinq captures chacune. Les **655 captures historiques** restantes attendent une comparaison aux builds actuels. La matrice suit l’origine et la fraîcheur des images sans annoncer une fidélité canonique 1:1 globale. [Matrice média](docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json).

**AVP Blood Arena** ouvre désormais son prototype web public : huit ressources correspondent au commit déployé, et un vrai déplacement a été vérifié dans Chromium. Sa galerie locale antérieure conserve sa preuve d’origine. **Chrono Recoil** décrit la production **1.6.0**, confirmée par son manifeste. **Massilia Cyberpunk** est recapturé depuis sa distribution locale actuelle, sans lui inventer un hébergement. Le [recoupement de 175 dépôts et 162 projets Vercel](docs/CATALOGUE_AUDIT_2026-11-09.md) conserve les 158 fiches : les bases documentaires ne sont pas ajoutées comme jeux autonomes.

Le launcher distingue maintenant **Présentation personnalisée** et **Aperçu personnalisé** des médias natifs officiels. Une couverture conservée dans le navigateur ne reçoit plus la provenance d’une autre image. Les légendes des mini-jeux décrivent une interface native lorsqu’aucun écran titre séparé n’existe. Le cache PWA passe à **shell v32 / médias v3**, avec conservation des favoris et des personnalisations.

Le [diagnostic des 158 destinations](docs/link-proof/live-links-2026-11-09.json) relève **152 sites accessibles, un téléchargement confirmé, un accès Vercel protégé et quatre pages GitHub à revérifier après des délais ou erreurs réseau temporaires**, sans lien explicitement cassé. Les cinq distributions locales restent référencées. Une réponse HTTP n’atteste pas l’intégralité du gameplay. La version publique dépend du dernier déploiement Vercel READY ; le statut de publication et son SHA figurent dans la PR de livraison.

```sh
npm test
npm run test:browser  # Chromium installé, Node.js 22 ou supérieur
npm run links:check
```

L’audit vérifie les fichiers, versions, sources et SHA ; le test navigateur couvre notamment les galeries, les visuels personnalisés, le cache, les migrations, les favoris et le mobile. Les sorties restent dans `.reports/`. Le mode édition et les archives restent publics, sans authentification administrateur serveur.

---

## Version 1.15 — Catalogue et galeries actualisés (2 novembre 2026)

**AVP Blood Arena — Relance technique 0.1.0** est ajouté comme prototype à télécharger : aucun déploiement Vercel n’existe, et les anciennes versions 0.30/0.36 ne sont pas restaurées. **SOMA//MASSILIA** est corrigé de 0.1.0 à **0.6.0**, confirmé par les sources et son manifeste public. Les 140 fiches historiques sont conservées, avec **18 jeux retrouvés** au total, dont **six distributions locales**. [Sources et couverture des 174 dépôts](docs/CATALOGUE_AUDIT_2026-11-02.md).

Ce lot apporte **20 nouvelles captures natives dans 4 galeries**, avec un écran réel et un aperçu par jeu :

- **RIFTCASTERS 3D — MODERN SKIES** : [preuve native](docs/media-proof/riftcasters-anglers-local-860-2026-11-02.json) ; version 8.6.0.
- **DIVA PULSE — Studio de rythme** : [preuve native](docs/media-proof/diva-pulse-local-v37-2026-11-02.json) ; version 37.0.0.
- **PARALLAXE — PROTOCOLE 9** : [preuve native](docs/media-proof/parallaxe-local-041-2026-11-02.json) ; version 0.4.1.
- **AVP BLOOD ARENA — RELANCE TECHNIQUE** : [preuve native](docs/media-proof/avp-blood-arena-local-010-2026-11-02.json) ; version 0.1.0.

Ces captures proviennent des sources exactes exécutées localement, sans génération d’illustration. DIVA PULSE montre notamment une démonstration en **Autoplay assisté**, pas une performance manuelle. Leurs limites, versions et SHA sont enregistrés dans chaque preuve. Les vues locales d’un jeu web sont distinguées d’une capture de production.

Le suivi totalise **105 captures documentées dans 21 galeries**. **655 captures historiques** attendent encore une comparaison au build et **6 jeux retrouvés** attendent leur première galerie (30 emplacements). Les visuels natifs prouvent le rendu observé, sans certification globale de fidélité canonique 1:1. Les anciennes images sont conservées. [Matrice média](docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json).

Les légendes de Resident Evil B.O.W. Protocol, Reclaimed et des autres galeries ne reprennent plus les mentions propres au terminal Codec ou à la simulation GPS d’un autre jeu. Le cache PWA **shell v31 / médias v2** recharge le catalogue et revalide les images mises à jour. Les favoris et personnalisations sont conservés lors de la migration du catalogue enregistré.

Le [contrôle réel des 158 destinations](docs/link-proof/live-links-2026-11-02.json) relève **151 sites accessibles, six dépôts de téléchargement, un accès Vercel protégé** et aucun lien cassé. Une réponse HTTP ne garantit pas la version du jeu ni sa jouabilité complète. Malaise Party affiche sa connexion requise ; les jeux locaux ouvrent **Fichiers et installation**.

Pour vérifier le lot :

```sh
npm test
npm run test:browser  # Chromium installé, Node.js 22 ou supérieur
npm run links:check
```

Le test navigateur sert automatiquement le site en local et contrôle les fiches, les commandes de galerie, le cache PWA, la migration des anciennes données, les favoris, les archives et le mobile. Les rapports et captures de test restent dans `.reports/`. La CI exécute l’audit, les tests de destinations et ce parcours navigateur.

**Limite maintenue :** le mode édition n’est pas une authentification admin ; le dépôt et ses archives restent publics. La PR conserve les travaux non terminés dans ses rapports. La publication Vercel doit être reliée au SHA vérifié, indépendamment de l’état de fusion de la PR.

## Version 1.14 — Première réconciliation (1er novembre 2026)

La branche précédente réunissait 157 fiches dont 144 jeux : 17 jeux retrouvés ajoutés aux 140 fiches historiques, sans suppression. Dix productions web, cinq éditions locales et deux mini-jeux d’anthologies ont été distingués. Le dernier état de cette vague documentait 85 captures dans 17 galeries. [Inventaire des découvertes](docs/RECOVERED_GAMES_2026-11-01.md) · [audit des distributions locales](docs/GITHUB_ONLY_GAMES_AUDIT_2026-11-01.md).

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
