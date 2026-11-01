# Jeux oubliés du Launcher Games — audit et intégration, 1er novembre 2026

## Principe

La PR [#17](https://github.com/darknigthmare/launcher-applications/pull/17) préserve les **140 fiches préexistantes** et ajoute **15 fiches de jeux distincts**. Il y a donc **155 fiches dont 142 jeux**. Chaque fiche dispose d'une identité source et d'un lien réel. Aucun dépôt de test, pack d'assets privé, copie de sauvegarde ou projet non jouable n'est artificiellement présenté comme un nouveau jeu.

Un titre de page HTML et un HTTP 200 prouvent l'identité de l'application servie et l'accès au document, **pas le fonctionnement de toutes ses mécaniques**. Le dernier déploiement Vercel, les images natives et la conformité aux références s'auditent séparément.

## Dix nouveaux jeux Vercel publics — candidats vérifiés

| ID | Jeu | Accès | Captures validées dans cette vague |
| --- | --- | --- | --- |
| `mass-effect-relay-chronicles` | Mass Effect — Relay Chronicles | https://masseffectrelaychronicles.vercel.app/ | En attente de capture native |
| `resident-evil-bow-protocol` | Resident Evil — B.O.W. Protocol | https://resident-evil-bow-protocol.vercel.app/ | Capture menu R20 et spécimens en cours ; jamais un combat supposé |
| `digital-circus-encore` | Digital Circus — Encore | https://digital-circus-encore.vercel.app/ | En attente de capture native ; distinct de l'interface CainOS |
| `yugioh-25d-holograms` | Yu-Gi-Oh! 2.5D Hologram Duel | https://yugioh-25d-holograms.vercel.app/ | En attente de capture native |
| `riftcasters-3d` | Riftcasters 3D — Convergence | https://riftcasters-3d.vercel.app/ | En attente de capture WebGL ; arena-survivor autonome |
| `riftcasters-chaos-anglers` | Riftcasters 3D — Modern Skies | https://riftcasters-chaos-anglers.vercel.app/ | En attente ; K-13 et Greywater, **distinct** de Convergence |
| `reclaimed-after-dark` | Reclaimed: After Dark | https://reclaimed-after-dark.vercel.app/ | En attente de capture native |
| `deadline-outbreak` | DEADLINE: Outbreak | https://deadline-outbreak.vercel.app/ | **Écran titre, aperçu + cinq images natives vérifiées** — [preuve](media-proof/deadline-outbreak-native-2026-11-01.json) |
| `ragtime-rumble-complete-tour` | Ragtime Rumble — Complete Tour | https://ragtime-rumble-complete-tour.vercel.app/ | En attente ; distinct de l'édition historique Ragtime Rumble |
| `silent-hill-halo-of-flesh` | Silent Hill: Halo of Flesh | https://silent-hill-halo-of-flesh-darknigthmares-projects.vercel.app/ | En attente ; dernier déploiement `ERROR`, publication antérieure accessible |

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
