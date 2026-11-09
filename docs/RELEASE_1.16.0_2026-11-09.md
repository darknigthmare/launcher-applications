# Livraison du launcher 1.16.0 — 9 novembre 2026

Cette livraison poursuit la version 1.15 fusionnée par la PR #17. Les 158 fiches, les 145 jeux et les 140 entrées historiques sont conservés.

## Médias complétés

Les six fiches encore sans galerie reçoivent chacune cinq captures natives, un écran d’entrée et un aperçu : Digital Circus Encore, Silent Hill Halo of Flesh, Fallout Marseille Mistral, Massilia Cyberpunk, SOLEIL et Maid Café Simulator Deluxe. Le total devient **135 captures documentées dans 27 galeries**. Les **18 jeux retrouvés** disposent désormais de leurs cinq images ; les **655 captures historiques** non révisées restent suivies dans la matrice.

Les preuves du 9 novembre identifient les sources exactes, versions, dimensions, commandes, états observés et empreintes. Les captures locales de Digital Circus et Silent Hill utilisent les fichiers du build publié, comparés octet par octet. Silent Hill montre la production 0.7 en Canvas 2D, distincte de la source 0.9.6. Les deux mini-jeux d’anthologie proviennent d’un HTML autonome public : le snapshot et son SHA sont conservés, sans inventer de commit Git ni de décor.

Fallout 0.50.0 utilise l’Exploration libre officielle, dont l’état prédéfini (niveau 26 et chapitre VI) est documenté ; aucune progression de campagne gagnée n’est prétendue. Massilia 0.76.0 utilise sa distribution locale et le secteur géographique fourni ; aucun hébergement, cache métropole complet ou relevé architectural 1:1 n’est inventé. Les captations attestent le rendu observé, sans certification canonique globale.

## Catalogue et comportement

- AVP Blood Arena ouvre maintenant le jeu web public. Son déploiement READY, huit ressources identiques à la source et un déplacement dans le navigateur ont été vérifiés ; l’ancienne preuve locale n’est pas réécrite.
- Chrono Recoil décrit sa production 1.6.0, confirmée par son manifeste public et le README de la révision correspondante.
- Le recoupement de 175 dépôts et 162 projets Vercel ne transforme pas les bases documentaires ni les squelettes récemment modifiés en nouveaux jeux.
- Les couvertures et aperçus personnalisés gardent leurs URL et sont étiquetés comme personnalisés. La provenance d’une image officielle ne leur est plus attribuée. Les mini-jeux sans écran titre séparé sont décrits comme des interfaces natives.
- Le cache PWA passe à shell v32 / médias v3. Les favoris, noms personnalisés et archives restent conservés.

## Vérification et publication

`npm test` contrôle le catalogue, les fichiers, les preuves et leurs empreintes, ainsi que les destinations. `npm run test:browser` couvre les galeries, le cache, les archives, les migrations, les favoris, les images personnalisées et le mobile. `npm run links:check` relève 152 sites accessibles, un téléchargement confirmé, un accès Vercel protégé et quatre pages GitHub à revérifier après des délais ou erreurs réseau temporaires. Aucun lien n’est explicitement cassé ; les cinq distributions locales restent référencées.

Le projet cible reste `launcher-applications`, équipe `darknigthmares-projects`, domaine `launcher-applications.vercel.app`. La livraison doit utiliser le SHA exact testé. Une création de déploiement acceptée ou une PR publiée ne prouvent pas que le domaine sert déjà cette version : vérifier l’état READY et les octets publics après publication. Le statut et l’ID de déploiement sont consignés dans la PR de cette livraison.
