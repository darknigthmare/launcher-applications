# Audit des jeux omis et des dépôts sans Vercel — 1er novembre 2026

## Méthode

Croisement des **172 dépôts GitHub** recherchables sur `darknigthmare`, des **162 projets Vercel** du compte `darknigthmares-projects` et du catalogue de **150 fiches avant cette vague**. Un nom différent ne prouve pas un jeu différent : les alias, branches DLC, laboratoires et copies de déploiement sont examinés séparément. La correspondance de l'identité n'atteste pas le fonctionnement de tous les modes.

Cette vague réintègre **quatre jeux réellement présents dans des dépôts publics**, avec documentation de lancement local et aucune image inventée. Le catalogue candidat contient ainsi **154 fiches dont 141 jeux**. Les 140 dossiers historiques restent inchangés ; les 10 réintégrations Vercel de la vague précédente restent conservées.

## Quatre jeux ajoutés avec leur véritable distribution

| Fiche | Référence primaire | Version documentée | Accès affiché dans le launcher | Limites |
| --- | --- | --- | --- | --- |
| DIVA PULSE — Studio de rythme | [Diva-Pulse](https://github.com/darknigthmare/Diva-Pulse) | Main V34 ; V37 en PR, **non fusionnée** | GitHub / jeu local | Aucun catalogue musical officiel, images du lecteur et scène encore à recapturer |
| DERNIÈRE LIGNE — ZÉRO REPLI | [The-Horde-The-Last-Stand](https://github.com/darknigthmare/The-Horde-The-Last-Stand) | 0.44.2 | GitHub / HTML jouable après extraction | Versions des routes, personnages, missions et HUD à vérifier sur le moteur réel |
| FALLOUT MARSEILLE — MISTRAL | [fallout-Marseille](https://github.com/darknigthmare/fallout-Marseille) | 0.50 | GitHub / installation locale documentée | Référentiels IGN et OSM réels mais **architecture visuelle 1:1 non atteinte** ; données de ville lourdes et couverture variable |
| PARALLAXE — PROTOCOLE 9 | [Parallaxe_Protocole9](https://github.com/darknigthmare/Parallaxe_Protocole9) | 0.4.1 | GitHub / téléchargement PC-LAN | Site `parallaxe-protocole-neuf.darknigthmare.chatgpt.site` à accès privé, ne pas le présenter comme public ; captures coop 3D non validées |

Ces quatre fiches utilisent `accessPolicy:"local-download"` : le bouton **Fichiers et installation** ouvre le dépôt, non un jeu déjà en cours d'exécution. Les fiches ont `mediaPendingReview:true`, un manifeste de galerie vide et **0 capture prétendument fidèle**. Une promotion visuelle requiert une capture réelle du jeu, son SHA source ou sa version runtime et une vérification du rendu. Les anciennes illustrations d'autres jeux ne sont pas réaffectées à ces quatre dossiers.

## Autres dépôts GitHub absents : décisions explicites

| Dépôt | État constaté dans GitHub | Décision |
| --- | --- | --- |
| `massilia-cyberpunk` | README : « Massilia Cyberpunk — SOMA//MASSILIA v0.72 » | Rapprocher la source de la fiche existante SOMA//MASSILIA avant de créer un doublon |
| `yautja-la-longue-chasse-dlc-prive` | Registre privé de référence pour modules et sprites d'un DLC, sans jeu indépendant | Ne pas exposer comme jeu ni ses références privées |
| `VHS`, `FollowTheWhiteRabbit`, `GideonProject` | README seul, pas de code de jeu à la racine | Projets repérés, non publiables comme jeu jouable |
| `StargateNoLimitVR`, `QuidditchVR`, `MGSVRmissions`, `XenoVR` | README isolé ou dépôt vide | Aucun build autonome à prétendre terminé |
| `Death-Stranding-2D` | README « Death-Stranding-2D » sans fichier moteur ni scène | Projet connu, ajouter seulement lorsque sources et build jouable existent |
| `TheInterview`, `HeroInWheelchair`, `ImpossibleMission`, `VRmania`, `AngelOfTheDead` | README et éventuels fichiers de configuration, pas de jeu livré | Maintenir en suivi de conception sans vignette ni URL de jeu fabriquées |
| `Franchise-Guide`, `quick-oppenheimer`, `BadgeSession-POC` | Guide, service SocialSeeker ou prototype d'authentification | Ne sont pas des jeux à ajouter au rayon Jeux |
| `launcher-applications` | Le launcher lui-même | Déjà à sa place, hors du décompte des jeux |

## Douze projets Vercel sans fiche nominale identique

| Projet(s) Vercel | Décision / vérification restante |
| --- | --- |
| `resident-evil-bow-protocol-live` | Produit Resident Evil B.O.W. Protocol déjà référencé sous son identité propre ; comparer le contenu des deux déploiements avant de créer une seconde version |
| `xion-path-test`, `xion-level-design-lab`, `xion-level-payload` | Tests de cheminement, laboratoire et payload : ne pas les compter comme trois jeux sans preuve d'un produit distinct |
| `reclaimed-after-dark-payload-a`, `reclaimed-after-dark-schema-check` | Artefacts techniques liés à RECLAIMED: AFTER DARK, pas de doublon du jeu principal |
| `jeux-du-4-aout-2026`, `jeux-du-2-aout-2026-jouables`, `jeux-du-2-aout-2026`, `games-du-2-aout-2026-schema-test`, `jeux-restaures-aout-2026` | Lots/bundles historiques ayant des déploiements READY ; **audit de leurs sous-jeux encore ouvert**. Ne pas affirmer qu'ils n'apportent aucun jeu unique sans lire leurs manifestes |
| `launcher-applications` | Hébergement du launcher lui-même, non un jeu omis |

## Bilan et garde-fous

- Les **154 fiches** ne signifient pas 154 jeux publiés sur Vercel : 13 fiches sont des outils et applications, et quatre nouveaux jeux nécessitent un lancement local.
- Les **140 applications initiales**, **112 anciennes illustrations**, archives de captures et preuves existantes sont préservées.
- Les jeux récupérés sans médias validés restent **textuels**. Les captures fictives, cartes promotionnelles non fondées et la prétention « fidèle 1:1 » sont interdites par le contrôle de catalogue.
- Le mode édition local n'est **pas** authentifié. Une véritable restriction des archives à l'administrateur impose stockage privé et contrôle d'identité côté serveur, qui ne sont pas livrés ici.
- Les liens GitHub sont des **dépôts de téléchargement**, non des URLs jouables ; leur état réseau figure séparément dans l'audit de liens.
- Les déploiements Vercel `ERROR`, les URL de connexion SSO et les laboratoires ne sont pas substitués à de véritables productions publiques.

### Prochaines validations ciblées

1. Captures natives de DIVA PULSE, Dernière Ligne, Fallout Mistral et PARALLAXE à partir de leur code, avec scénarios jouables et informations de version.
2. Audit des cinq bundles d'août, afin de retrouver d'éventuels jeux réellement distincts encore omis.
3. Correspondance exacte entre SOMA//MASSILIA en production et la source `massilia-cyberpunk` avant mise à jour des descriptions et visuels.
4. Revue manuelle de la fidélité des présentations restantes et protection serveur des archives.

Le but est d'exposer **tous les jeux vérifiables**, et de garder une liste précise des projets seulement esquissés, sans faux positifs.
