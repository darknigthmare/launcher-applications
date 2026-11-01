# Jeux oubliés du Launcher Games — audit et intégration, 1er novembre 2026

## Principe

La PR [#17](https://github.com/darknigthmare/launcher-applications/pull/17) préserve les **140 fiches préexistantes** et ajoute **17 fiches de jeux distincts** : dix productions Vercel, cinq éditions locales GitHub et deux mini-jeux autonomes restaurés dans les anthologies d’août. Il y a donc **157 fiches dont 144 jeux**. Chaque fiche dispose d'une identité source et d'un lien réel. Aucun dépôt de test, pack d'assets privé, copie de sauvegarde ou projet non jouable n'est artificiellement présenté comme un nouveau jeu.

Un titre de page HTML et un HTTP 200 prouvent l'identité de l'application servie et l'accès au document, **pas le fonctionnement de toutes ses mécaniques**. Le dernier déploiement Vercel, les images natives et la conformité aux références s'auditent séparément.

## Dix nouveaux jeux Vercel publics — candidats vérifiés

| ID | Jeu | Accès | Captures validées dans cette vague |
| --- | --- | --- | --- |
| `mass-effect-relay-chronicles` | Mass Effect — Relay Chronicles | https://masseffectrelaychronicles.vercel.app/ | Cinq vues réelles : création, personnalisation, dialogue Anderson, Normandy 2D/3D et équipement ([preuve](media-proof/mass-effect-relay-native-2026-11-01.json)). Rendu réel, **pas canon 1:1 certifié** |
| `resident-evil-bow-protocol` | Resident Evil — B.O.W. Protocol | https://resident-evil-bow-protocol.vercel.app/ | Écran d’entrée + cinq vues de menu R20 vérifiées ([preuves](media-proof/resident-evil-bow-r20-2026-11-01.json)) ; **pas une capture de combat** |
| `digital-circus-encore` | Digital Circus — Encore | https://digital-circus-encore.vercel.app/ | En attente de capture native ; distinct de l'interface CainOS |
| `yugioh-25d-holograms` | Yu-Gi-Oh! 2.5D Hologram Duel | https://yugioh-25d-holograms.vercel.app/ | Cinq vues vérifiées du simulateur : deck, solo, Atlas, duel compact et Vue Réelle ([preuve](media-proof/yugioh-hologram-native-2026-11-01.json)). Le dernier écran est **Vue Arène**, pas Vue Réelle 3D, qui reste à capturer. **Aucune certification des modèles 1:1** |
| `riftcasters-3d` | Riftcasters 3D — Convergence | https://riftcasters-3d.vercel.app/ | Cinq captures natives WebGL : sélection d’Elias Quill, journal, arène, égide réellement activée et pause ; mana passé de 100 à 80,56 ([preuve](media-proof/riftcasters-convergence-native-2026-11-01.json)). Seul le début de campagne est démontré, **pas toute la Convergence ni les boss 1:1** |
| `riftcasters-chaos-anglers` | Riftcasters 3D — Modern Skies | https://riftcasters-chaos-anglers.vercel.app/ | En attente ; K-13 et Greywater, **distinct** de Convergence |
| `reclaimed-after-dark` | Reclaimed: After Dark | https://reclaimed-after-dark.vercel.app/ | En attente de capture native |
| `deadline-outbreak` | DEADLINE: Outbreak | https://deadline-outbreak.vercel.app/ | **Écran titre, aperçu + cinq images natives vérifiées** — [preuve](media-proof/deadline-outbreak-native-2026-11-01.json) |
| `ragtime-rumble-complete-tour` | Ragtime Rumble — Complete Tour | https://ragtime-rumble-complete-tour.vercel.app/ | **Cinq captures natives** : menu, Tournée, éditeur de partitions, combat Maestro Bellows et pause, version 3.2.0-alpha.3 publiée (voir [preuve](media-proof/ragtime-complete-tour-native-2026-11-01.json)). Distinct de l'édition historique Ragtime Rumble ; aucune image promotionnelle 1:1 certifiée |
| `silent-hill-halo-of-flesh` | Silent Hill: Halo of Flesh | https://silent-hill-halo-of-flesh-darknigthmares-projects.vercel.app/ | En attente ; dernier déploiement `ERROR`, publication antérieure accessible |

La revue native des médias du 1er novembre a validé plusieurs jeux réellement joués au lieu de leur inventer des images promotionnelles : Mass Effect et Yu-Gi-Oh! sont désormais illustrés par leurs propres rendus. Les autres fiches sans images restent strictement sans capture publique validée.

Le relevé HTTP et les titres de ces pages ont été testés dans les [exécutions GitHub Actions de découverte](https://github.com/darknigthmare/launcher-applications/actions/workflows/verify-missing-games.yml) ; les fiches ne promettent pas d'interactions non vérifiées.

**Doublon écarté :** `resident-evil-bow-protocol-live` affiche l'identité de Resident Evil: B.O.W. Protocol déjà présent sous son domaine principal. Une seule fiche est créée.

## Cinq jeux à télécharger ou à lancer localement

| ID | Jeu et source | Mode d'accès |
| --- | --- | --- |
| `diva-pulse` | [Diva Pulse](https://github.com/darknigthmare/Diva-Pulse) · V34 main, V37 PR | Installer/télécharger le dépôt, Python ; pas de Vercel public garanti |
| `derniere-ligne-zero-repli` | [Dernière Ligne — Zéro Repli](https://github.com/darknigthmare/The-Horde-The-Last-Stand) · 0.44.2 | Ouvrir le fichier HTML extrait en local, profils hors ligne |
| `fallout-marseille-mistral` | [Fallout Marseille — Mistral](https://github.com/darknigthmare/fallout-Marseille) · v0.50 | Projet complet local, données cartographiques et lanceur ; fidélité architecturale non certifiée |
| `parallaxe-protocole-9` | [Parallaxe — Protocole 9](https://github.com/darknigthmare/Parallaxe_Protocole9) · 0.4.1 | Paquet PC/LAN ; site personnel privé, donc lien GitHub vers instructions |
| `massilia-cyberpunk` | [Massilia Cyberpunk](https://github.com/darknigthmare/massilia-cyberpunk) · 0.72 | Déploiement local avec Python et données IGN/OSM ; distinct de SOMA//MASSILIA |

Le bouton de ces fiches indique **« Fichiers et installation »** et le badge **« Jeu à télécharger »**. Une adresse GitHub n'est jamais présentée comme un lien « jouer directement dans le navigateur ».

## Deux mini-jeux autonomes retrouvés dans les anthologies d'août

Ces jeux possèdent chacun leurs commandes et règles identifiables dans le catalogue restauré. Ils restent hébergés dans un même site de collection : ne pas les confondre avec une nouvelle production Vercel indépendante.

| ID | Accès et provenance | Ce qui distingue le jeu |
| --- | --- | --- |
| `dont-look-when-they-say-soleil` | https://jeux-restaures-aout-2026.vercel.app/#soleil | Épreuve de réaction au signal « SOLEIL », distincte de SOLEIL MORT |
| `maid-cafe-simulator-deluxe` | https://jeux-restaures-aout-2026.vercel.app/#maid-cafe | Service arcade chronométré, distinct de Moonlit Maid Café |

Aucune capture n'est déclarée validée pour ces deux mini-jeux ; elles restent dans la file de revue des médias. L'[inventaire détaillé](MEDIA_FIDELITY_MATRIX_2026-11-01.json) conserve les 17 identités sans doublons ni faux visuels.

## Projets examinés mais volontairement exclus

- `resident-evil-bow-protocol-live` : doublon de B.O.W. Protocol.
- `TheHive`, `VHS`, `MGSVRmissions`, `Death-Stranding-2D`, `XenoVR`, `StargateNoLimitVR`, `VRmania` et autres squelettes vides : aucune version jouable vérifiée dans ces dépôts.
- `yautja-la-longue-chasse-dlc-prive` : pack de références et de production privé, **pas** jeu autonome.
- `Franchise-Guide`, `BadgeSession-POC`, outils, fichiers de test et payloads : ne pas faire passer des ressources de projet pour de nouveaux jeux.
- Des projets Vercel aux noms similaires ou suffixés ne deviennent pas des doublons de fiche sans analyse de leur identité.

## Les visuels : règle de fidélité

- Pour les nouveaux jeux, une fiche sans captures garde **zéro illustration et zéro screenshot fictif**, avec un monogramme et un fond sombre dans le launcher.
- Une image de **vrai écran titre** du jeu peut servir de présentation sans prétendre être un keyart reproduisant les personnages sous tous les angles.
- La capture d'un menu ou d'une archive n'est pas une **capture de gameplay combat**, même lorsqu'elle provient d'une vraie exécution Chromium.
- Pour tout média validé : garder l'URL du jeu, la version réellement observée, l'état de l'écran, la date de capture, les cinq hashes SHA-256, et la preuve dans `docs/media-proof/`.
- Les anciennes 140 fiches, leurs 140 présentations, 140 aperçus, 700 captures et 112 illustrations historiques restent conservées ; aucune suppression « pour nettoyer ».
- L'**archive visuelle dans le mode édition n'est pas une protection serveur** : les fichiers statiques restent accessibles sans authentification. Une restriction réelle exigera connexion admin et stockage privé.

## Suites classées

**P0 :** authentification réelle des archives si leur confidentialité est impérative ; contrôle navigateur des éditions publiques ; vérification des versions SHA Vercel ; comparaison scène par scène des silhouettes, armes et costumes des jeux fan-made.

**P1 :** continuer les captures natives par lots (les jeux retrouvés sans visuels, puis les galeries historiques), documenter les échecs et les alternatives, conserver les anciens médias. Éviter de considérer une capture d'écran native comme une validation artistique globale 1:1.

**P2 :** consolider les métadonnées de franchises, extensions et versions distinctes, mettre en place un renouvellement automatique **du diagnostic** mais jamais une publication automatique de visuels non approuvés.

La [matrice JSON complète de fidélité](MEDIA_FIDELITY_MATRIX_2026-11-01.json) est la source de vérité des tâches encore ouvertes.
