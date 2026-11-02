# Launcher Games — Revue liens, fiches et visuels (2026-11-01)

> **Instantané historique du 1er novembre.** Les ajouts et corrections du 2 novembre sont suivis dans [l’audit actuel](CATALOGUE_AUDIT_2026-11-02.md), le [README](../README.md) et la [matrice média actualisée](MEDIA_FIDELITY_MATRIX_2026-11-01.json). Les nombres et mentions « pas encore intégré » ci-dessous décrivent l’état initial, pas le catalogue actuel.

## Portée vérifiée

- Source du launcher : `darknigthmare/launcher-applications` (branche principale trouvée sur `e3da5a7`, version 1.12.0, 30 août 2026).
- Production du launcher : `launcher-applications.vercel.app`, déploiement `dpl_CYg5GLsPQgKrvKSLmfx2ZQNU5xLH` en état `READY`.
- Catalogue existant : 140 entrées, dont 127 jeux ; 140 présentations, 140 aperçus, 700 chemins de captures historiques et 112 anciennes illustrations.
- Vercel : 162 projets listés dans le compte au moment de l'examen. Le nom d'un projet, son alias public et un déploiement hashé ne sont **pas** interchangeables.
- 19 URL utilisaient déjà une adresse différente du nom exact du projet : la plupart sont des alias légitimes, notamment les domaines historiquement suffixés, raccourcis et `eager-curie.vercel.app`. Ils ne doivent pas être réécrits sans preuve.
- Une URL qui retourne 200 n'établit ni la fraîcheur d'un jeu ni la fidélité de son illustration. Les informations de source et de production sont suivies séparément.

## Destinations corrigées après vérification de leur identité

Le premier rapprochement par nom de projet avait remplacé quatre URL historiques par des domaines d'équipe **protégés par Vercel SSO**. Un HTTP 200 redirigé vers `vercel.com/login` n'ouvre pas un jeu. Le second audit a testé les huit adresses, leur titre HTML et la destination finale.

| Jeu | URL retenue | Validation |
| --- | --- | --- |
| Brèche Multiverselle | `https://multiverse-breach.vercel.app` | 200 et titre `Multiverse Breach - Retro Smash Crossover` |
| Vortex Command | `https://vortex-command.vercel.app` | 200, titre `Vortex Command — Protocole Léviathan`, moteur 1.0.0 lancé et capturé |
| PREDATOR: HIVE WARRIORS | `https://yautja-hive-warriors.vercel.app` | 200 et titre `HIVE WARRIORS — La chasse commence` |
| Malaise Party | `https://malaise-party-darknigthmares-projects.vercel.app` | **Connexion Vercel requise**, ancienne adresse historique en 404 ; accès non présenté comme public |

Le nouveau contrôleur classe **139 URL accessibles sans redirection Vercel SSO détectée** et **une URL à authentifier**, contre 140 réponses HTTP positives trompeuses dans l'ancien contrôle. Une réponse HTTP et un titre correspondant ne prouvent pas la fraîcheur du build ni l'exécution de toutes les missions.

[Rapport comparatif des huit liens et du SSO](LINK_IDENTITY_SSO_2026-11-01.md). [Contrôle réseau final](https://github.com/darknigthmare/launcher-applications/actions/runs/41314151948).

## Aliases particuliers conservés volontairement

- MangaFinder : `manga-finder-orcin.vercel.app` ; Can I Eat It : `can-i-eat-it-five.vercel.app` ; SpinFrame : `spinframe-three.vercel.app` ; Chroma Forge : `chroma-forge-chi.vercel.app`.
- Yomi no Kage : `fait-un-jeux-pixel-qui-alterne.vercel.app` ; ECHO RIFT : `echo-rift-opal.vercel.app` ; VEILBOUND : alias court en `...-bris.vercel.app`.
- Les entrées à très longs noms (Registre Creux, Croq'Collect, Encrevivante, Vesper//Rite, Suture Noire) conservent leurs domaines tronqués officiellement attachés.
- Echo Forest, ECHO//WEAVE, PULSE//RAIL, NEON DESCENT, RIFF//RUSH utilisent des alias avec suffixe attachés à leur projet.
- `hive-ascension-cycle` pointe vers `eager-curie.vercel.app`, alias attaché au projet Vercel `hive_ascension`, distinct du projet `hive-ascension`. Ne pas fusionner ces deux fiches sans comparaison des jeux.
- `valkyrie-sweeper-dark-siege` utilise `infernal-city-five.vercel.app`, alias du projet `infernal-city`. L'identité du jeu réellement servi doit être comparée dans le navigateur avant tout changement.

## Anomalies et restrictions observées

- L'ancien scan HTTP annonçait d'abord **139 joignables et une 404**, puis 140 réponses positives ; quatre étaient en réalité des redirections SSO. Le nouveau scan d'identité classe 139 adresses sans redirection SSO détectée, 1 adresse protégée et aucun 404.
- Le dernier déploiement Vercel signalé pour **Can I Eat It** était en `ERROR`. L'alias historique est néanmoins toujours déclaré sur le projet. Ne pas remplacer une adresse connue par l'URL du déploiement échoué.
- Le dernier déploiement du projet **Silent Hill: Halo of Flesh** était également en `ERROR`. Ce projet ne figure pas encore au catalogue ; une création de fiche serait prématurée sans production confirmée, illustrations et captures.
- Projets publiés sur Vercel mais pas intégrés comme nouvelles fiches dans ce lot : Mass Effect Relay Chronicles, Digital Circus Encore, Resident Evil B.O.W. Protocol, Riftcasters 3D, ainsi que plusieurs projets de développement, schéma et test. Leur publication ne suffit pas à inventer les visuels ou à prétendre que leurs mécaniques sont finies.
- Les captures existantes proviennent de la vague de catalogue du 30 août. Une mise à jour du build source en octobre ne garantit pas qu'une capture de cette galerie montre encore le rendu réel actuel.

## Documentation ayant motivé les descriptions

| Entrée | Source consultée | Détails repris sans prétention de certification 1:1 |
| --- | --- | --- |
| Malaise Party | README du dépôt privé `malaise-party`, candidat 2.0.0 | Plateau de 40 cases, douze mini-jeux, quatre joueurs locaux et Sang-froid ; version source candidate, déploiement final à qualifier |
| TRIARCHE : Ciel Rouge | README du dépôt `triarche-ciel-rouge`, prototype 1.0.0 | Deux campagnes de sept missions, quatre châssis aliens, cinq spécialisations humaines, treize opérations libres, ville destructible |
| WORLD HIVE WARS | README du dépôt `world-hive-wars`, état source 0.45.0 | Campagne de terrain, opérations CONTACT et différence entre armes jouables et études d'archive |
| DEADWALL | README du dépôt `deadwall-last-enclosure`, état source 1.74.0 | D-17, haltes, équipements réellement utilisables, récupérateurs d'eau de pluie et économie matérielle |
| MOUSTIQUE | README du dépôt `moustique-the-video-game`, état source 4.14.1-R11 | Vol 3D, 20 missions, huit espèces, maison, balcon, araignée et supports physiques |
| Yautja: Apex Hunt | README du dépôt `yautja-apex-hunt` | Croiseur, paquetages restreints, neuf biomes et quinze contrats |
| Yautja : La Longue Chasse | README du dépôt `yautja-la-longue-chasse`, état source V99 | Contrats 2D, guerres de clans, Preserve Hunt, Homeworld, limites de complétude |
| Shadow Codec Ops | README du dépôt `shadow-codec-ops`, état source 3.7.0 | Codec, 24 Side Ops sur douze époques, scènes MG1/MGS1/Ground Zeroes |
| CainOS | README du dépôt `cainos` | Terminal et Circus Combat : 14 combattants, douze arènes, neuf modes |
| Vortex Command | README du dépôt `vortex-command`, version source 1.0.0 | Six districts, huit familles de kaijus, doctrines, évacuations et logistique |
| AVP: HUNT // HIVE TCG | README du dépôt `avp-hunt-hive-tcg` | 158 cartes, trois voies, decks de 30 et huit missions |
| ALIENS: Tantalus Frontier | Brief de projet et catalogue existant | Exploration latérale et secteurs ; rattachement corrigé de `Aliens: Dark Descent` à la franchise `Alien` |

Les versions ci-dessus sont des **références de code**, pas des preuves exhaustives que chaque élément est déjà en production. Les descriptions évitent les affirmations de fidélité 1:1 sur les éléments non recoupés.

## Nouveau fonctionnement des archives

- `assets/app-gallery.json` ne contient plus de référence `previousPresentation`.
- `assets/app-gallery-admin.json` rassemble les 112 chemins historiques et n'est demandé par le navigateur qu'après l'activation du mode édition.
- À la sortie du mode édition, le launcher vide les références historiques de l'état actif, remet le carrousel à sa position initiale et n'affiche plus les images d'archive.
- Le contrôle `npm test` doit vérifier les 112 images dans le manifeste séparé sans les exposer dans le manifeste public.

**Restriction de sécurité fondamentale :** le mode édition est un bouton libre, non une connexion administrateur authentifiée. Les 112 fichiers physiques restent accessibles dans le dépôt GitHub public et sur l'hébergement statique. Pour une exclusivité effective à l'administrateur, il faudra déplacer les originaux vers un stockage privé, les servir via une route autorisée et ajouter une vérification d'identité côté serveur. Cette PR ne prétend pas apporter cette sécurité.

La [matrice exhaustive](MEDIA_FIDELITY_MATRIX_2026-11-01.json) suit 140 fiches, 700 captures et 112 historiques, avec 13 projets en priorité P0. Chaque entrée reste `not-reviewed` tant qu'elle n'a pas été comparée aux sources et à la version jouable.

## Recaptures natives effectivement intégrées le 1er novembre 2026

| Jeu | Captures recapturées | Version du site / source recoupée | Preuves | Original conservé |
| --- | ---: | --- | --- | --- |
| TRIARCHE : Ciel Rouge | 5 | 1.0.0, deux campagnes, opérations de convoi et boss | [Gameplay TRIARCHE](media-proof/triarch-gameplay-2026-11-01.json) | Cinq anciens PNG et aperçu JPG |
| DEADWALL | 5 | 1.74.0, D-17, mouvement joueur et poste de commandement | [Gameplay DEADWALL](media-proof/deadwall-gameplay-2026-11-01.json) | Cinq anciens PNG et aperçu PNG |
| Yautja: Apex Hunt | 5 | source 1.13.0, production `5e386e0`, croiseur, contrats, armurerie, paquetage et chasse au Goliath | [Gameplay WebGL Yautja](media-proof/yautja-apex-gameplay-2026-11-01.json) | Cinq anciens PNG et aperçu JPG |
| MOUSTIQUE | 5 | 4.14.1-R11, moteur WebGL2, vol libre + quatre scènes cadrées via la caméra de QA du jeu | [Moteur WebGL2 MOUSTIQUE](media-proof/moustique-webgl2-2026-11-01.json) | Cinq anciens WebP et aperçu WebP |
| WORLD HIVE WARS | 5 | 0.45.0, une véritable nouvelle campagne en simulation privée ; carte, Bastion, défense, escouade et Codex, sans capture de CONTACT | [Interfaces de campagne 0.45](media-proof/world-hive-045-campaign-2026-11-01.json) | Cinq anciens WebP et aperçu WebP |
| Shadow Codec Ops | 5 | 3.10, modules Codec et campagne, tableau de 31 Side Ops, CQC Versus réel. L'image de la mission Phaser non lisible a été remplacée par le menu d'opérations et n'est **pas** présentée comme du combat | [Modules Shadow 3.10](media-proof/shadow-codec-3100-modules-2026-11-01.json) | Cinq PNG historiques et aperçu JPG |
| CainOS / Digital Circus — Encore | 5 | CainOS v0.98 après calibration utilisateur, archives C&A, neuf modes, 14 combattants, douze arènes et duel 2D Pomni/Jax recadré sur l'arène | [CainOS & Encore 0.7](media-proof/cainos-encore-070-2026-11-01.json) | Cinq anciens PNG et aperçu JPG |
| AVP: HUNT // HIVE TCG | 5 | Runtime 1.0.0, duel sur trois voies, collection 158 cartes, decks de 30, boosters et huit opérations | [Duel et contenu TCG](media-proof/avp-tcg-gameplay-2026-11-01.json) | Cinq anciens visuels et aperçu |
| Vortex Command | 5 | Runtime RTS 1.0.0, titan émergé, interface anatomie, six districts civils, R&D et carte du monde | [RTS Vortex réel](media-proof/vortex-command-rts-2026-11-01.json) | Cinq PNG précédents et aperçu JPG |

**45 nouvelles captures sur 700**, donc **655 captures non révisées**. Les 9 galeries reçoivent un aperçu actuel distinct, un mode de preuve et des titres de scène ; les anciennes images ne sont pas supprimées. Les illustrations promotionnelles des 9 jeux restent en attente de fidélité 1:1. Les fichiers physiques restent publics et le « mode édition » n'est pas une authentification.

Les cinq captures de WORLD HIVE WARS sont des vues de la campagne réelle : l'entrée, l'onboarding et les cinq changements de poste passent par l'interface du jeu, avec une nouvelle sauvegarde privée, **sans fournir de données GPS**. Elles ne constituent pas des captures du combat CONTACT.

Les **quatre cadrages de MOUSTIQUE hors vol libre** proviennent du vrai renderer du jeu mais utilisent la caméra de QA et un temps de simulation arrêté. Ils ne sont pas des captures de progression naturelle. Une capture authentique ne prouve pas une fidélité 1:1 aux œuvres inspiratrices ; les audits de silhouette, style, armes et équipements restent ouverts.

La [matrice exhaustive des 140 jeux](MEDIA_FIDELITY_MATRIX_2026-11-01.json) et le [suivi vérifié des 13 dernières productions prioritaires](PRODUCTION_DEPLOYMENTS_2026-11-01.md) permettent de distinguer visuels acceptés, visuels non relus, origine des screenshots, date du dernier déploiement et version du code.

## Galerie : critères de recevabilité pour les nouveaux visuels

1. Comparer la nouvelle illustration au concept propre du jeu et aux captures **du build actuel**, pas seulement à la franchise inspiratrice.
2. Conserver le fichier antérieur et sa provenance ; n'effacer aucun élément de la galerie historique.
3. Séparer rigoureusement **illustration promotionnelle**, **aperçu** et **capture de gameplay réellement prise dans le jeu**.
4. Pour un titre 2D, 2,5D ou 3D, respecter la perspective, les personnages, la silhouette, les proportions, les équipements, les lieux et le HUD attestés par le code.
5. Documenter source, version, date, cadrage, état de mission, approbation et limites pour chaque capture refaite.
6. Ne jamais écrire « 1:1 validé » lorsqu'un sprite, une scène ou une arme reste une interprétation, une esquisse ou un placeholder.

Une proposition d'illustration pour TRIARCHE a été générée dans la conversation du 1er novembre mais **non ajoutée au dépôt** : elle nécessite encore une comparaison aux visuels du jeu avant toute promotion publique.

## Reprises prioritaires, distinctes des modifications livrées

- **P0 — Liens :** 139 adresses sans SSO détecté, Malaise Party avec connexion Vercel requise ; continuer les parcours jouables et vérifier la version de production de chaque jeu.
- **P0 — Confidentialité :** authentifier le mode administrateur et protéger le stockage des archives si les fichiers doivent réellement être privés.
- **P1 — Captures :** poursuivre les 655 captures historiques : Yautja La Longue Chasse, HIVE ASCENSION, ALIENS Tantalus Frontier, Malaise Party (derrière SSO), et les autres jeux modifiés après août.
- **P1 — Visuels :** revue comparative 1:1 des 140 présentations et 140 aperçus, puis remplacement par vagues de fichiers approuvés ; conserver les anciens dans l'archive.
- **P2 — Nouvelles fiches :** ajouter les nouveaux projets réellement publiés seulement après vérification de leur gameplay, crédits, liens, médias et sources.

## Suivi technique

- `npm test` : audit statique des fichiers, galeries, manifestes et chemins. **Réussi** sur la PR #17 ([audit 44](https://github.com/darknigthmare/launcher-applications/actions/runs/41293517270)).
- `npm run links:check` : état HTTP des 140 liens, écrit `.reports/live-link-status.json` (rapport non versionné).
- `.github/workflows/link-health.yml` : diagnostic quotidien ou manuel ; aucune modification automatique des URL.
