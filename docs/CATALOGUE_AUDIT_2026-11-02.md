# Catalogue : nouveaux dépôts et versions — 2 novembre 2026

Le compte GitHub compte **174 dépôts accessibles** lors du relevé authentifié (`GET /user/repos`, pagination à 100). Le précédent audit en comptait 172. Ce relevé retrouve deux nouveaux noms absents du catalogue : un jeu public autonome et un référentiel privé. Les noms seuls ne suffisent pas à établir une identité ni la jouabilité ; les fichiers primaires ont donc été lus.

## AVP Blood Arena : une nouvelle fiche locale

- Source publique : [avp-blood-arena](https://github.com/darknigthmare/avp-blood-arena), branche `main`, commit `c2e2d71f7d87bac2f9065061e99a7a5129d091c6`.
- [README](https://github.com/darknigthmare/avp-blood-arena/blob/c2e2d71f7d87bac2f9065061e99a7a5129d091c6/README.md), `package.json` et `index.html` confirment **0.1.0 — Relance technique**, un prototype de sport tactique au tour par tour : Nexus, score, IA et deux joueurs locaux. Les versions historiques 0.30 et 0.36 ne sont **pas restaurées** dans ce dépôt.
- `npm test` a été exécuté sur le clone de ce SHA : syntaxe, données, ressources/DOM, correspondances et refus d’une fausse restauration passent. Le registre contient 68 références et 18 profils, dont **4 vérifiés / 14 provisoires** ; ces nombres ne certifient pas une conformité globale des personnages ou des règles historiques.
- Le projet Vercel `avp-blood-arena` existe (`prj_b6gFx5Agx5Fp686pQssE0FmhNwg7`) et possède un domaine déclaré, mais **zéro déploiement** dans le relevé Vercel. Une URL affectée à un projet n’est pas une production jouable.
- La fiche du launcher ouvre donc **les fichiers et l’installation locale**, avec `accessPolicy: local-download`, et nomme explicitement le prototype. Les données sont chargées par HTTP : servir le dépôt extrait avec un serveur local, plutôt qu’ouvrir seulement le HTML par `file://`.

Une [preuve navigateur native](media-proof/avp-blood-arena-local-010-2026-11-02.json) accompagne désormais l’écran titre, l’aperçu et cinq captures du même commit intact : règles, sélection d’un Marine, déplacement réel avec passage de deux à un point d’action, capacité défensive suivie de la réponse de l’IA à la deuxième manche, puis arène des Ruines en mode deux joueurs locaux. Les sept images ont été inspectées visuellement. Elles montrent les formes tactiques du prototype, sans prétendre représenter les personnages historiques animés, une partie terminée ou un test humain à deux joueurs.

Le catalogue passe de **157 fiches / 144 jeux** à **158 fiches / 145 jeux**, avec **18 découvertes** ajoutées aux 140 fiches historiques. Les éditions GitHub locales sont désormais au nombre de six. Les médias restent suivis séparément dans la matrice de fidélité ; aucun visuel historique n’a été supprimé par cette intégration.

## Référentiel exclu

`alien_base` est un registre privé partagé de références et de profils, utilisé par des jeux consommateurs au moyen de snapshots publics versionnés. Son README précise qu’il n’impose pas de gameplay unique. Ce n’est donc **pas un dix-neuvième jeu**, et le launcher n’ajoute aucun lien de jeu vers cette base privée.

Les squelettes sans jeu livré, guides, outils et packs privés explicitement exclus lors de l’[audit précédent](GITHUB_ONLY_GAMES_AUDIT_2026-11-01.md) restent exclus. Le relevé nominal ne requalifie pas ces dépôts sans nouveau code jouable.

## SOMA//MASSILIA : 0.1.0 était obsolète

La fiche historique décrivait encore une Vertical Slice 0.1.0. Le [README courant](https://github.com/darknigthmare/soma-massilia/blob/main/README.md), [`package.json`](https://github.com/darknigthmare/soma-massilia/blob/main/package.json) et la [livraison](https://github.com/darknigthmare/soma-massilia/blob/main/RELEASE.md) documentent désormais **0.6.0** : prologue, six opérations compactes, Cellule NULL et cinq conclusions.

Contrôle public réel du 2 novembre :

| Ressource | Résultat observé |
| --- | --- |
| `https://soma-massilia.vercel.app/` | HTTP 200, titre `SOMA//MASSILIA — La Chair sous Licence` |
| `https://soma-massilia.vercel.app/precache.json` | HTTP 200, `version: 0.6.0`, 23 assets |

La description et le tag « Campagne solo » remplacent l’ancienne mention 0.1.0. La fiche est distinguée de `massilia-cyberpunk`, un autre moteur géographique local en 0.72. Les captures antérieures conservent leur statut de comparaison nécessaire : ces contrôles HTTP n’attestent pas un nouveau parcours complet ni leur fraîcheur.

## Versions locales vérifiées sans modification artificielle

Les README primaires des cinq jeux déjà ajoutés ont été relus : Dernière Ligne **0.44.2**, Fallout Mistral **0.50**, Parallaxe **0.4.1** et Massilia Cyberpunk **0.72**. Une version mentionnée dans une PR ne remplace pas automatiquement la version distribuée.

**DIVA PULSE : le README est lui-même en retard.** Il annonce encore « V34 main / V37 proposée en PR », mais le commit `main` réellement cloné le 2 novembre, `9a6a00412cd719fd141daa7f47fde3392d81f8a7`, contient `package.json` et `VERSION.txt` en **37.0.0**, ainsi que le HTML autonome `DIVA_PULSE_JOUER.html` dont le titre est « DIVA PULSE — Prises fiables & brouillons protégés V37 ». Les captures natives locales sont reliées à ce HTML exact et à son SHA-256. Le bandeau conserve la marque historique « 34.0 » ; cela n'est pas une preuve d'un moteur V34. Aucune production Vercel n'est inventée, et les personnages restent des silhouettes procédurales de travail, sans certification de modèles MMD sous licence.

La [matrice média](MEDIA_FIDELITY_MATRIX_2026-11-01.json) demeure le suivi des captures à renouveler ; les contrôles de publication du launcher doivent porter sur le nouveau commit, indépendamment des anciens résultats verts.
