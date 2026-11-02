# Livraison du launcher 1.15.0 — 2 novembre 2026

Cette livraison prolonge la PR #17 : les jeux absents sont distingués des doublons, les versions sont recoupées avec des fichiers primaires et les captures manquantes proviennent des moteurs réels.

## Changements

- Catalogue : 158 fiches, 145 jeux, 18 découvertes conservant les 140 entrées historiques. AVP Blood Arena 0.1.0 est une distribution locale, sans déploiement Vercel ; SOMA//MASSILIA est confirmé en 0.6.0 par son manifeste public.
- Quatre galeries natives supplémentaires : DIVA PULSE, Parallaxe, AVP Blood Arena et Riftcasters Chaos Anglers. Sources exactes, cadrages, états observés et SHA dans `docs/media-proof/*2026-11-02.json`. L’Autoplay de DIVA est explicitement assisté ; Riftcasters montre le début K-13, sans inventaire ni campagne terminée.
- Les légendes génériques n’attribuent plus le terminal Codec ou une simulation GPS à d’autres jeux. Les concepts en attente de revue sont masqués dans la galerie publique, y compris Vortex avant le chargement du manifeste.
- PWA : shell v31 et médias v2 ; installation du shell avec `cache: reload`, revalidation des médias aux noms stables. Les anciennes installations reçoivent le nouveau catalogue après actualisation.
- Contrôles : tests de destination dans la CI, détection des pages Vercel Authentication sur leur propre domaine, preuves natives locales vérifiées génériquement (source, version, dimensions et empreintes).

## Vérification

`npm test` vérifie les fichiers, la taxonomie, les manifestes, les archives, les scènes et leurs SHA ; huit cas couvrent les destinations. `npm run test:browser` sert le vrai site et vérifie onze comportements, dont le cache PWA, les galeries, la migration d’un catalogue obsolète, les favoris, la personnalisation et le mobile. Les captures de ce test restent dans `.reports/`.

Le diagnostic des 158 liens est enregistré dans [la preuve réseau](link-proof/live-links-2026-11-02.json). Les tests du launcher n’attestent pas tous les parcours des jeux externes. La matrice garde les 655 captures historiques non révisées et les six nouvelles fiches encore sans galerie. Les archives et le mode édition restent publics, sans authentification admin serveur.

## Publication

La publication doit utiliser le SHA exact de cette branche vérifiée sur le projet Vercel existant `launcher-applications`, équipe `darknigthmares-projects`, domaine `launcher-applications.vercel.app`. La PR reste la trace de revue ; un déploiement de ce SHA ne fusionne pas la branche dans `main`.
