# Catalogue : accès publics et versions — 9 novembre 2026

L’audit reprend le catalogue **1.15.0**, intégré par la PR #17 au commit `58e141e`, et préserve le commit `fad9613` qui a ajouté les outils IA le 4 novembre. Les instructions `AGENTS.md` de ce nouveau commit ont été lues. Aucun outil mentionné dans un README n’est présenté comme installé sans vérification.

## Couverture des projets

Le relevé authentifié et paginé retrouve **175 dépôts GitHub** et **162 projets Vercel distincts**. Les deux pages Vercel contiennent 100 et 63 lignes, avec le même projet frontière `umbra-les-heures-noires` : les additionner sans dédupliquer produirait un faux total de 163.

Le seul nouveau nom absent du catalogue depuis le relevé de 174 dépôts est **Yautja_Base**. Son README documente un référentiel de 481 notices, des exports et des correspondances inter-jeux ; il ne livre pas un jeu autonome. Ses zéro actif visuel certifié ne deviennent pas des captures du launcher. La base n’ajoute donc aucune fiche de jeu.

Les arbres des quatorze anciens projets exclus ont été réinspectés : AngelOfTheDead, FollowTheWhiteRabbit, GideonProject, HeroInWheelchair, ImpossibleMission, MGSVRmissions, QuidditchVR, StargateNoLimitVR, TheInterview, VHS, VRmania, XenoVR, Death-Stranding-2D et TheHive. Hors outils IA nouvellement ajoutés, ils contiennent seulement des README, une configuration Git ou aucun fichier. Leur date de push récente ne prouve pas un nouveau moteur jouable.

Les révisions d’arbres, décisions et limites sont conservées dans la [preuve de couverture](link-proof/catalogue-coverage-2026-11-09.json). Cette vérification nominale ne certifie pas tous les parcours des 145 jeux existants. **Le catalogue reste à 158 fiches, dont 145 jeux**, avant les autres travaux de cette vague ; aucun doublon n’a été créé pour gonfler le décompte.

## AVP Blood Arena : le jeu dispose maintenant d’un accès public

La fiche du 2 novembre indiquait correctement un dépôt à télécharger : aucun déploiement n’existait alors. Cette situation a changé.

| Contrôle du 9 novembre | Preuve observée |
| --- | --- |
| URL publique | `https://avp-blood-arena.vercel.app/`, HTTP 200, titre exact « AVP Blood Arena — Relance technique » |
| Déploiement Vercel | `dpl_5JHhPGc3CySrJ61fTgQZT98ALb4V`, **READY**, cible **production** |
| Révision du déploiement | `d722e728c72a8f092b515f3f21ed47fedcf84c52` |
| Identité des fichiers | **8 ressources publiques identiques octet par octet** aux fichiers de cette révision : HTML, styles, moteur et cinq fichiers de données |
| Navigateur public | Neuf factions chargées, match démarré, Marine sélectionné et déplacement natif consommant un PA (**2 → 1**) |

La fiche ouvre désormais le jeu dans le navigateur avec un statut Vercel. Le dépôt source reste associé à la fiche. Le prototype conserve sa version **0.1.0** et ses limites : les versions historiques 0.30 et 0.36 ne sont pas restaurées, et quatorze des dix-huit profils sportifs restent provisoires.

La [preuve de production](link-proof/avp-blood-arena-public-2026-11-09.json) et la [capture de contrôle public](verification/avp-blood-public-2026-11-09.png) sont distinctes de la [galerie locale du 2 novembre](media-proof/avp-blood-arena-local-010-2026-11-02.json), qui reste inchangée. La nouvelle source a évolué : les anciennes images gardent leur vraie révision `c2e2d71`, sans être automatiquement déclarées fraîches pour `d722e728`. Une identité HTTP, même accompagnée d’un déplacement testé, ne prouve ni une rencontre entière ni la restauration du jeu historique.

Le navigateur Chromium a accédé directement à cette URL publique avec la configuration et la confiance TLS héritées. Aucun contournement de certificat ni changement de confiance n’a été utilisé.

## Chrono Recoil : présenter la version publiée plutôt que le seul import audio

La fiche ne décrivait que l’analyse d’une musique personnelle. Le [manifeste public](https://chrono-recoil.vercel.app/release.json) répond maintenant en HTTP 200 avec :

- version **1.6.0** ;
- commit **`2bf2373c8cf5c1a140481684298e3f5e6b93c408`** ;
- `dirty: false`.

Le README a été lu **à cette révision exacte**, et pas seulement sur la branche courante. Il décrit treize missions, quatre boss, 130 Chrono-épreuves, six difficultés et onze vaisseaux. La description et le pitch mettent donc en avant le tir rythmique à rebours, la campagne et les épreuves ; le mode Arcade conserve l’analyse locale des fichiers personnels sans téléversement.

La [preuve de version](link-proof/chrono-recoil-release-2026-11-09.json) conserve le manifeste, son empreinte et les sources documentaires. Le champ `builtAt` du manifeste reste celui renvoyé par le jeu ; il n’a pas été remplacé par la date de cet audit. Les anciennes images attendent toujours leur comparaison avec le build : aucun nouveau parcours complet de campagne ni renouvellement de galerie n’est prétendu par cette correction de texte.

## Préservation des preuves

Les anciens rapports, images et galeries sont conservés. Un accès passé de téléchargement à navigateur ne change pas rétroactivement l’origine locale d’une capture. Les contrôles de la source, du déploiement, du gameplay et de la fidélité visuelle restent des preuves distinctes. Les autres captures réalisées pendant cette vague sont suivies par leurs propres rapports média et par la matrice de fidélité.
