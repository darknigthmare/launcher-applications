# État des productions Vercel des 13 fiches prioritaires — 1er novembre 2026

> **Instantané historique du 1er novembre.** Les ajouts et corrections du 2 novembre sont suivis dans [l’audit actuel](CATALOGUE_AUDIT_2026-11-02.md), le [README](../README.md) et la [matrice média actualisée](MEDIA_FIDELITY_MATRIX_2026-11-01.json). Les nombres et mentions « pas encore intégré » ci-dessous décrivent l’état initial, pas le catalogue actuel.

Relevé effectué sur les déploiements de **production** de l'équipe Vercel `darknigthmares-projects`. La date est en UTC. **Un statut READY prouve la construction et la publication du déploiement indiqué, pas l'exécution de tous les parcours du jeu.** Les alias du launcher ont été testés indépendamment en HTTP (140/140 accessibles). Un commit source plus récent que la publication ne doit pas être présenté comme déjà en ligne.

| Jeu | Dernier déploiement de production consulté | État | Commit de déploiement | ID Vercel | Conclusion |
| --- | --- | --- | --- | --- | --- |
| TRIARCHE : Ciel Rouge | 2026-07-23 06:34 | READY | `5377572d012b` | `dpl_GBwrqfGNDZ46PBcwvKQ8T18EjDPY` | Runtime 1.0.0 vérifié pendant les cinq recaptures |
| DEADWALL — Last Enclosure | 2026-10-28 12:34 | READY | `0a38a12301e1` | `dpl_8h3R83UiEfbEdUVpt2WjCnQFEURU` | Runtime 1.74.0 vérifié pendant les cinq recaptures |
| WORLD HIVE WARS | 2026-11-01 02:30 | READY | `80ce99282b12` | `dpl_AiQV6pxL4fRpuigUUrJ268qSsNyw` | Source et gameplay à comparer, en particulier les variantes de modes |
| MOUSTIQUE: THE VIDEO GAME | 2026-10-29 10:10 | READY | `fad4c525ab9c` | `dpl_3i7qc2G4HZ2uPTbkd9ZzVR3szafY` | La source fait état de 4.14.1-R11, capture du build à rapprocher |
| Yautja: Apex Hunt | 2026-10-30 08:20 | READY | `5e386e0c1efc` | `dpl_3bVUaoiRC2tSoXUeJ6YGUnySwwPu` | WebGL, croiseur et préparation vérifiés ; recapture intégrale en validation |
| Yautja : La Longue Chasse | 2026-10-28 07:38 | READY | `a5a951e3f6db` | `dpl_73NLawsmfUie4rgBBpm7CpVzfJG5` | Vérifier correspondance des modes V99 au build public |
| Vortex Command | 2026-07-23 06:39 | BLOCKED | `46dc84898ed6` | `dpl_59hZa7jVcNMSERpBLpPXimXLXfwe` | Ne pas présenter ce build comme jouable. Dernier READY connu 06:29, SHA `ceba6c081982` |
| Shadow Codec Ops | 2026-10-28 10:00 | READY | `77c830974fa6` | `dpl_B142nqaBD7CWoC9xoBwL8voL271E` | Vérifier captures et scènes MG1/MGS1 avant validation 1:1 |
| CainOS | 2026-10-25 05:51 | READY | `146a68cc87ea` | `dpl_EFQiRKV6Vsdo7yrxqA4182NHuFDz` | Vérifier interface terminal / Circus Combat séparément |
| HIVE ASCENSION : Cycle Évolutif | 2026-10-28 10:35 | READY | `f15a56c5dd38` | `dpl_4cKst2QC3aKppW6RvD2kWCepSv34` | Projet Vercel `hive_ascension`, alias `eager-curie.vercel.app`, distinct de `hive-ascension` |
| ALIENS: Tantalus Frontier | 2026-10-25 09:04 | READY | `ebbdbb6520e4` | `dpl_7WRjH5tu7ftprrjQ1tFq7SWxQRS4` | Rattachement lore corrigé à Alien, parcours jouables à vérifier |
| AVP: HUNT // HIVE TCG | 2026-09-04 17:07 | READY | `e7a9c8ee6017` | `dpl_7DwmFGBSZeYQm1P6npzrnFqMeeS6` | Les cartes/visuels ne sont pas présumés fidèles 1:1 |
| MALAISE PARTY | 2026-09-02 01:21 | ERROR | `82a083568a78` | `dpl_FX2QpRk3pKvwWA1CKXShDhSPXeNd` | Déploiement précédent READY (01:19), même SHA `82a0835`, id `dpl_DU8s2TMnpmP8LPiayZEFZULMC7mV` ; URL stable 200 |

## Règles de correction du launcher

- Conserver un **alias permanent** rattaché au projet, plutôt qu'une URL de déploiement hashée qui change à chaque publication.
- Ne jamais annoncer la dernière version du **code GitHub** comme dernière version **déployée** sans correspondance vérifiable du SHA ou du contenu runtime.
- Une réponse 200 n'est pas un test de scénario : chaque fiche garde séparément la disponibilité HTTP, l'identité du déploiement, l'exécution du gameplay, la qualité des captures et la fidélité 1:1.
- Une génération ou capture infidèle ne devient pas une « vraie capture » ; sauvegarder la précédente en archive et consigner la preuve du rendu.
- Pour Vortex Command et Malaise Party, ne pas rediriger le launcher vers un déploiement en erreur ou bloqué.

Ce tableau est un **instantané de recherche**, pas un suivi temps réel ; le diagnostic de disponibilité du launcher est relancé chaque jour via GitHub Actions. Les changements documentés dans la PR ne fusionnent pas automatiquement les projets distincts et ne modifient pas leur code de jeu.
