# Jeux web publiés — vérifications du 13 novembre 2026

**Trois jeux sont publiés et vérifiés en public ; deux restent en publication.** Les deux destinations en attente sont réellement détenues par les bons projets Vercel. Leur bouton de lancement reste désactivé : un domaine existant ou un ancien frontend répondant 200 ne certifie pas un jeu complet utilisable.

| Jeu publié | Version et source réellement déployées | Adresse publique | Contrôles passés |
| --- | --- | --- | --- |
| DIVA PULSE | 37.0.0 · `9bbf125cba1f20f49634a4cf49a346d87b2f013e` | https://diva-pulse.vercel.app/ | 6 fichiers HTTP 200, SHA identiques à la source ; éditeur, NEON PROMISE en Autoplay avec audio actif, pause. |
| Dernière Ligne — Zéro Repli | 0.44.2 · `bbbd3ef5afefcc9005c4f7a57f8282281dcb9d42` | https://derniere-ligne-zero-repli.vercel.app/ | 5 fichiers HTTP 200, SHA identiques ; campagnes, préparation du Dépôt 07, nuit 01 en combat et pause. Le propriétaire observe aussi le tir souris, munitions de 12 à 10. |
| Massilia Cyberpunk | 0.78.0 · `8dc3e0f9ee5155c361468924947100ba44cd3bc8` | https://massilia-cyberpunk.vercel.app/ | HTML racine et nommé, viewer, manifeste et provenance HTTP 200 ; 12 gzip de 3 cellules dans les 4 familles contrôlés par SHA et décodés ; rue, marche réelle, cortex, carte et fiche de lieu. |

Les trois déploiements sont READY, cible production. Leurs URL ont été ouvertes sans jeton de contournement ni connexion Vercel. Les contrôles indépendants utilisent un profil Chromium neuf et les commandes normales du jeu. Les identifiants, horaires UTC, empreintes, états observés et captures sont consignés dans [le relevé structuré](WEB_GAME_DEPLOYMENTS_2026-11-13.json) et [web-deployment-proof](web-deployment-proof/).

DIVA a passé une courte démonstration assistée et une navigation dans l’éditeur ; la performance manuelle et tous les imports ne sont pas certifiés. Dernière Ligne a atteint le combat de la première nuit ; les autres routes et la fin de campagne ne sont pas certifiées. Massilia conserve les **168 cellules et 10,5 km² du centre** : le cache métropolitain complet demeure absent. Le contrôle indépendant porte sur les fichiers de lancement et douze charges de cellules effectivement récupérées et décodées. La comparaison des 729 entrées de manifestes par le propriétaire ne signifie pas que chaque fichier a été téléchargé en public. La géographie et les façades du jeu ne certifient pas une fidélité architecturale 1:1.

## Deux publications en attente

| Jeu | Domaine détenu, lancement désactivé | Source finale préparée | État public observé |
| --- | --- | --- | --- |
| Fallout Marseille — MISTRAL | https://fallout-marseille-mistral.vercel.app/ | `98085d3c9b6f33215e03892edc4c419d97ff5e83` · [PR #21](https://github.com/darknigthmare/fallout-Marseille/pull/21) | Aucun déploiement dans le projet au contrôle de 08:30:47 UTC ; HTTP 404. |
| PARALLAXE — Protocole 9 | https://parallaxe-protocole-9.vercel.app/ | `659bdd1185cf9f127b6d9d684ae60261e3813f6e` · [PR #6](https://github.com/darknigthmare/Parallaxe_Protocole9/pull/6) | Ancienne production `23fd9cd…` READY et frontend HTTP 200 ; API coopérative HTTP 500. Le bundle corrigé final n’est pas encore publié. |

Le quota Vercel a été observé sur **Parallaxe à 08:10:59.209 UTC** : HTTP 402 `payment_required`, code `api-deployments-free-per-day`, message « Resource is limited - try again in 24 hours (more than 100) », délai indiqué de 86 400 secondes. Il concerne l’équipe. Fallout n’a pas subi de soumission manuelle après ce quota connu : aucun 402 propre à Fallout n’est inventé. Le [relevé du quota](web-deployment-proof/team-deployment-quota.json) distingue la réponse rapportée par le propriétaire et sa corroboration par le statut GitHub Vercel. Aucune offre payante n’a été activée.

La livraison **locale** Fallout conserve 7 761 fichiers et six familles de données. Le déplacement en exploration narrative, le Pip-Boy et huit tests passent. Le chargeur géographique de diagnostic récupère 140 requêtes de données HTTP 200, mais reste LOADING après 240 secondes sous SwiftShader : la traversée géographique jouable ne peut pas être certifiée. Les HTML original et exporté ont des empreintes distinctes ; leur identité n’est pas prétendue.

Le port Parallaxe corrigé conserve le frontend et les règles du jeu, avec sessions persistantes et fonctions compilées pour Vercel. Les essais du propriétaire utilisent un serveur applicatif **local** et une vraie base Supabase distante : quatre clients, trois jonctions concurrentes, neuf consensus, projections privées, signalisation radio authentifiée, reprise après redémarrage et deux profils Chrome par l’interface native. Ils ne valident pas la production Vercel ; microphone physique et TURN restent non vérifiés. La version du package final est **0.4.1**, pas l’étiquette historique 0.2 d’un ancien rapport réseau. Le résumé conservé exclut codes et identifiants de salon, jetons, seeds, secrets, cookies et clés.

Les captures historiques du catalogue conservent leurs builds et origines d’époque. Elles ne deviennent pas des captures des nouvelles productions par changement de lien. Les deux entrées en attente devront passer un déploiement du SHA corrigé et un contrôle public complet avant activation ; Parallaxe devra notamment réussir la coopération avec deux clients distincts.
