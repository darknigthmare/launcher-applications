# Launcher Games — Revue liens, fiches et visuels (2026-11-01)

## Portée vérifiée

- Source du launcher : `darknigthmare/launcher-applications` (branche principale trouvée sur `e3da5a7`, version 1.12.0, 30 août 2026).
- Production du launcher : `launcher-applications.vercel.app`, déploiement `dpl_CYg5GLsPQgKrvKSLmfx2ZQNU5xLH` en état `READY`.
- Catalogue existant : 140 entrées, dont 127 jeux ; 140 présentations, 140 aperçus, 700 chemins de captures historiques et 112 anciennes illustrations.
- Vercel : 162 projets listés dans le compte au moment de l'examen. Le nom d'un projet, son alias public et un déploiement hashé ne sont **pas** interchangeables.
- 19 URL utilisaient déjà une adresse différente du nom exact du projet : la plupart sont des alias légitimes, notamment les domaines historiquement suffixés, raccourcis et `eager-curie.vercel.app`. Ils ne doivent pas être réécrits sans preuve.
- Une URL qui retourne 200 n'établit ni la fraîcheur d'un jeu ni la fidélité de son illustration. Les informations de source et de production sont suivies séparément.

## Quatre liens corrigés après vérification des domaines Vercel

| Jeu | Ancien lien | Alias stable présent sur le projet |
| --- | --- | --- |
| Brèche Multiverselle | `https://multiverse-breach.vercel.app` | `https://multiverse-breach-darknigthmares-projects.vercel.app` |
| Vortex Command | `https://vortex-command.vercel.app` | `https://vortex-command-darknigthmares-projects.vercel.app` |
| PREDATOR: HIVE WARRIORS | `https://yautja-hive-warriors.vercel.app` | `https://yautja-hive-warriors-darknigthmares-projects.vercel.app` |
| Malaise Party | `https://malaise-party.vercel.app` (404 en audit GitHub Actions) | `https://malaise-party-darknigthmares-projects.vercel.app` (joignable lors du second audit) |

Les trois premiers projets ont un déploiement Vercel récent marqué `READY`. Pour Malaise Party, le dernier déploiement est en `ERROR` mais une publication précédente du même commit est en `READY`; la nouvelle URL pointe vers le domaine déclaré du projet, sans certifier une nouvelle livraison. Le second audit réseau a bien constaté l'accès HTTP au nouvel alias. Un parcours de jeu réel reste un contrôle distinct.

## Aliases particuliers conservés volontairement

- MangaFinder : `manga-finder-orcin.vercel.app` ; Can I Eat It : `can-i-eat-it-five.vercel.app` ; SpinFrame : `spinframe-three.vercel.app` ; Chroma Forge : `chroma-forge-chi.vercel.app`.
- Yomi no Kage : `fait-un-jeux-pixel-qui-alterne.vercel.app` ; ECHO RIFT : `echo-rift-opal.vercel.app` ; VEILBOUND : alias court en `...-bris.vercel.app`.
- Les entrées à très longs noms (Registre Creux, Croq'Collect, Encrevivante, Vesper//Rite, Suture Noire) conservent leurs domaines tronqués officiellement attachés.
- Echo Forest, ECHO//WEAVE, PULSE//RAIL, NEON DESCENT, RIFF//RUSH utilisent des alias avec suffixe attachés à leur projet.
- `hive-ascension-cycle` pointe vers `eager-curie.vercel.app`, alias attaché au projet Vercel `hive_ascension`, distinct du projet `hive-ascension`. Ne pas fusionner ces deux fiches sans comparaison des jeux.
- `valkyrie-sweeper-dark-siege` utilise `infernal-city-five.vercel.app`, alias du projet `infernal-city`. L'identité du jeu réellement servi doit être comparée dans le navigateur avant tout changement.

## Anomalies et restrictions observées

- Le premier scan HTTP des 140 liens a retourné **139 URL joignables et une 404** pour `malaise-party.vercel.app`. Le second scan a ensuite obtenu **140 URL joignables, sans erreur ni lien manquant**, avec son rapport en artefact GitHub Actions ([exécution 4](https://github.com/darknigthmare/launcher-applications/actions/runs/41293686597)).
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

## Galerie : critères de recevabilité pour les nouveaux visuels

1. Comparer la nouvelle illustration au concept propre du jeu et aux captures **du build actuel**, pas seulement à la franchise inspiratrice.
2. Conserver le fichier antérieur et sa provenance ; n'effacer aucun élément de la galerie historique.
3. Séparer rigoureusement **illustration promotionnelle**, **aperçu** et **capture de gameplay réellement prise dans le jeu**.
4. Pour un titre 2D, 2,5D ou 3D, respecter la perspective, les personnages, la silhouette, les proportions, les équipements, les lieux et le HUD attestés par le code.
5. Documenter source, version, date, cadrage, état de mission, approbation et limites pour chaque capture refaite.
6. Ne jamais écrire « 1:1 validé » lorsqu'un sprite, une scène ou une arme reste une interprétation, une esquisse ou un placeholder.

Une proposition d'illustration pour TRIARCHE a été générée dans la conversation du 1er novembre mais **non ajoutée au dépôt** : elle nécessite encore une comparaison aux visuels du jeu avant toute promotion publique.

## Reprises prioritaires, distinctes des modifications livrées

- **P0 — Liens :** exécuter `npm run links:check` dans un environnement avec accès réseau et examiner le rapport HTTP complet ; vérifier les parcours jouables des alias à identité ambiguë.
- **P0 — Confidentialité :** authentifier le mode administrateur et protéger le stockage des archives si les fichiers doivent réellement être privés.
- **P1 — Captures :** revoir et recapturer les galeries de WORLD HIVE WARS, TRIARCHE, DEADWALL, MOUSTIQUE, Yautja: Apex Hunt, La Longue Chasse, Vortex Command, Shadow Codec Ops, CainOS et des autres jeux modifiés après août.
- **P1 — Visuels :** revue comparative 1:1 des 140 présentations et 140 aperçus, puis remplacement par vagues de fichiers approuvés ; conserver les anciens dans l'archive.
- **P2 — Nouvelles fiches :** ajouter les nouveaux projets réellement publiés seulement après vérification de leur gameplay, crédits, liens, médias et sources.

## Suivi technique

- `npm test` : audit statique des fichiers, galeries, manifestes et chemins. **Réussi** sur la PR #17 ([audit 44](https://github.com/darknigthmare/launcher-applications/actions/runs/41293517270)).
- `npm run links:check` : état HTTP des 140 liens, écrit `.reports/live-link-status.json` (rapport non versionné).
- `.github/workflows/link-health.yml` : diagnostic quotidien ou manuel ; aucune modification automatique des URL.
