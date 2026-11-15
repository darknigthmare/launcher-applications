# Launcher 1.18.0 — Raccordements Vercel

Deux nouvelles fiches : **Angel of the Dead** et **ORDRE DE CENDRE**. Cinq fiches locales deviennent des accès web directs. Ragtime Rumble original et Complete Tour restent distincts. Total : **160 fiches /147 jeux**.

## Destinations vérifiées

| Jeu | Adresse | Révision publiée observée |
| --- | --- | --- |
| imperium-march | https://imperium-march.vercel.app/ | `06a6b0b15c504cb5f185c407e551cb15da64270a` |
| diva-pulse | https://diva-pulse.vercel.app/ | `9bbf125cba1f20f49634a4cf49a346d87b2f013e` |
| derniere-ligne-zero-repli | https://derniere-ligne-zero-repli.vercel.app/ | `bbbd3ef5afefcc9005c4f7a57f8282281dcb9d42` |
| fallout-marseille-mistral | https://fallout-marseille-mistral.vercel.app/ | `98085d3c9b6f33215e03892edc4c419d97ff5e83` |
| parallaxe-protocole-9 | https://parallaxe-protocole-9.vercel.app/ | `23fd9cdbe297cad1d3962c9fa33adb6683899793` |
| massilia-cyberpunk | https://massilia-cyberpunk.vercel.app/ | `8dc3e0f9ee5155c361468924947100ba44cd3bc8` |
| angel-of-the-dead | https://angel-of-the-dead.vercel.app/ | `8839f74bd975e8adf6ccd7afac63dc7e717a88f6` |
| ragtime-rumble | https://ragtime-rumble.vercel.app/ | `0024dfed5da7af37217f09c794e0f492a50319aa` |

Les [preuves détaillées](link-proof/vercel-catalogue-2026-11-16.json) conservent projet, déploiement, commit, alias et réponse publique. Une identité HTTP et un état READY ne certifient pas tous les modes de jeu. Les captures locales antérieures conservent leur source, leur date et leur portée.

## Médias et historique

Les 158 fiches antérieures et tous leurs fichiers média restent présents. Les deux nouvelles fiches attendent leurs premières captures natives et leurs illustrations revues. Le tableau de santé conserve ces dix emplacements de capture ouverts. Les illustrations existantes restent soumises à leurs empreintes et à leur revue.

## Vérification

`npm test` réussit localement : **12 286 contrôles de catalogue et 8 tests de classification des destinations**, sous Node 24.22.1. Les 1 218 médias historiques et natifs, ainsi que les 27 illustrations promotionnelles existantes, restent vérifiés par les contrôles de provenance et d’empreinte.

Le parcours Chromium local n’a pas pu démarrer : l’environnement refuse la création du socket de profil (`Operation not permitted`). Ce résultat n’est pas présenté comme une réussite de navigateur. Le parcours existant est étendu aux huit destinations et à la migration des anciennes fiches ; son résultat CI figure dans la pull request de livraison.

Le cache du shell passe à v34 afin de récupérer le catalogue, et les favoris/noms personnalisés restent conservés. Les six fichiers de distribution d’Obscura sont ajoutés sans modification des instructions existantes ni installation de binaire.
