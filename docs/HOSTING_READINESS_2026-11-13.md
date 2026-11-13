# Préparation à l’hébergement des cinq jeux locaux — 13 novembre 2026

Ce diagnostic précède la demande ultérieure de création des cinq sites. Il conserve ses observations de préparation et ses limites d’origine ; l’exécution autorisée, les adaptations effectives et les tests des nouvelles productions sont suivis dans [Jeux web publiés — vérifications](WEB_GAME_DEPLOYMENTS_2026-11-13.md).

Ce relevé distingue la possibilité technique d’héberger le vrai jeu et l’existence d’une adresse publique vérifiée. Il ne crée aucun projet, ne déploie rien et ne modifie aucune source de jeu. Les sondes et recherches d’adresses sont suivies séparément par l’audit du catalogue.

## DIVA PULSE : publication statique directe possible

- Dépôt : `darknigthmare/Diva-Pulse`, identifiant GitHub **1434898441**.
- Révision principale lue : `9bbf125cba1f20f49634a4cf49a346d87b2f013e`.
- Artefact prêt : **`index.html`**, identique à `DIVA_PULSE_JOUER.html`, **922 489 octets** ; SHA-256 `61d87a5929a91331b699005c4a5582e312a84abf821460fa915091f5b4bfd8ba`.
- Le package et le titre de l’artefact identifient V37. Le README conserve une mention historique V34 sur `main` ; il ne faut pas préférer cette phrase à l’artefact effectivement lu.
- `build.py` assemble styles et scripts dans les deux HTML, sans CDN. Aucun serveur de jeu n’est nécessaire. `lancer.py` est un serveur de fichiers local ; `/pulse-health` aide uniquement le lanceur à reconnaître son propre processus.
- Pour conserver les fonctions PWA, publier aussi `manifest.webmanifest`, `sw.js`, `icons/icon-192.png` et `icons/icon-512.png`, ainsi que le nom historique `DIVA_PULSE_JOUER.html`. Le manifeste est ajouté dynamiquement par le jeu : une recherche des seules balises HTML statiques ne le repère pas.

Réglages de déploiement proposés, sans changement de la source :

```json
{
  "framework": null,
  "rootDirectory": null,
  "installCommand": "true",
  "buildCommand": "mkdir -p .vercel-static/icons && cp index.html DIVA_PULSE_JOUER.html manifest.webmanifest sw.js .vercel-static/ && cp icons/icon-192.png icons/icon-512.png .vercel-static/icons/",
  "outputDirectory": ".vercel-static",
  "nodeVersion": "24.x"
}
```

Le répertoire de sortie contient uniquement la livraison utile. Les sources, historiques, bibliothèques locales et médias importés par les joueurs ne doivent pas être ajoutés à ce paquet. Une nouvelle origine HTTPS possède son propre stockage navigateur : l’export/import de bibliothèque existant reste nécessaire pour transférer une partie locale.

## Dernière Ligne — Zéro Repli : publication statique directe possible

- Dépôt : `darknigthmare/The-Horde-The-Last-Stand`, identifiant GitHub **1438215160**.
- Révision principale lue : `bbbd3ef5afefcc9005c4f7a57f8282281dcb9d42`.
- Artefact prêt : **`game/JOUER_DERNIERE_LIGNE.html`**, version 0.44.2, **28 022 243 octets**.
- Blob Git vérifié après téléchargement : `dd4266b97a4a064d918e4e1876d12f4a1101b48b` ; SHA-256 du HTML `7edd451c079b5d72ab31acf6cc49aba4e805801271afd24972d36e49ba65e1d1`.
- Les images du jeu sont intégrées au HTML et l’audio est synthétisé. Les seuls compléments HTTP observés dans la source sont le manifeste PWA, son icône SVG et `assets/audio/manifest.json`. Ce dernier fait 20 octets et déclare une collection de samples vide ; aucun fichier audio externe n’y est requis.
- Aucun `npm install`, compte, base ou serveur de session n’est nécessaire. Le HTML doit rester un fichier statique servi par le CDN, sans le faire transiter par une fonction applicative.

Réglages proposés :

```json
{
  "framework": null,
  "rootDirectory": "game",
  "installCommand": "true",
  "buildCommand": "mkdir -p .vercel-static/assets/audio .vercel-static/assets/icons && cp JOUER_DERNIERE_LIGNE.html .vercel-static/index.html && cp JOUER_DERNIERE_LIGNE.html manifest.webmanifest .vercel-static/ && cp assets/audio/manifest.json .vercel-static/assets/audio/ && cp assets/icons/icon.svg .vercel-static/assets/icons/",
  "outputDirectory": ".vercel-static",
  "nodeVersion": "24.x"
}
```

Le deuxième nom du HTML conserve le `start_url` du manifeste sans toucher au moteur. Deux copies de 28 Mo sont publiées ; les documents de QA, sources et anciens rapports de plusieurs mégaoctets restent hors sortie. Les fichiers de jeu doivent être comparés à ces empreintes après déploiement, puis le parcours campagne → préparation → combat doit être repris sur l’adresse publique.

## PARALLAXE : le jeu coopératif complet ne peut pas être publié comme une simple page statique

Le `package.json` propose deux constructions réelles :

- L’édition hébergée utilise **Vinext**, un Worker Cloudflare et une base **D1**. `app/api/session/route.ts` importe `cloudflare:workers`, lit `env.DB`, applique les sessions autoritaires et sérialise les votes concurrents. La simple détection « Next.js » par Vercel ne remplace pas ces dépendances.
- `npm run build:local` produit le frontend Vite et les modules de règles. `scripts/start-local.mjs` fournit `/api/session`, conserve les salons dans `.parallaxe-data/sessions.json` et gère la signalisation WebRTC. Le frontend est commun aux deux éditions.

Le mode solo peut rester utilisable sans D1 ; le service répond explicitement que le solo demeure disponible lorsque la coopération manque. Le publier seul sous le nom du jeu complet retirerait cependant les salons de deux à quatre inspecteurs et leur radio. Une publication fidèle demanderait un backend de session durable compatible, une adaptation vérifiée des routes et des essais de coopération. HTTPS est nécessaire au microphone ; certains réseaux demandent aussi un relais TURN. Aucun de ces services n’a été créé ou changé dans ce relevé.

## Fallout Marseille — MISTRAL : programme web prêt, livraison cartographique et routes locales à préparer

Le dépôt fournit `index.html` et `JOUER_FALLOUT_MISTRAL_v0.50.html` de **3 600 277 octets**, mais le README demande de lancer `tools/serve_game.py`. Ce serveur prépare les packs cartographiques depuis les archives Git, puis sert les fichiers et des routes d’audit :

- `/__mistral/local-data` ;
- `/__mistral/world-sources` ;
- `/__mistral/city-sources` ;
- `/__mistral/precise-terrain`.

Les audits inspectent les données réellement présentes et les caches de fichiers. Les quatre familles de données doivent être extraites et contrôlées ; le seul HTML ne conserve pas l’accès à la carte acquise. Le README courant ajoute notamment six archives de relief, environ **150,58 Mio compressés / 183,42 Mio décompressés**, en plus des packs précédents.

Un hébergement web est possible après un vrai travail de livraison : préparer la carte, sélectionner tous les fichiers runtime, vérifier le streaming et adapter honnêtement les services locaux. Copier le seul HTML ou simuler des réponses d’audit pour annoncer « la ville complète » ne préserverait pas le jeu. Aucun paquet de publication web fidèle ni adaptation de serveur n’a été produit ici.

## Massilia Cyberpunk : serveur statique, mais construction et périmètre des données à respecter

Le lanceur courant reconstruit la livraison jusqu’à **0.78**. Les HTML générés ne sont pas directement présents dans l’arborescence Git : `lancer.py --prepare-only` restaure d’abord les payloads contrôlés, puis applique les builders des versions 0.68 à 0.78. La base 0.67 fournit un HTML de **51 742 676 octets** ; son prédécesseur compressé est réparti en deux parties. Le manifeste conserve aussi un fichier OSM de **44 250 286 octets** et les catalogues de navigation.

**Ce jeu ne dépend pas d’un backend de session pour son exécution.** `game/tools/serve_v78.py` délègue à `serve_v68.py`, un simple `SimpleHTTPRequestHandler`. Une sortie statique pourrait donc servir le véritable HTML 0.78 et ses ressources après reconstruction contrôlée ; ce cas ne doit pas être confondu avec PARALLAXE.

La préparation conserve plusieurs éditions et le README demande au moins 2 Go de place temporaire. Il faudrait publier uniquement la version courante et les fichiers qu’elle consomme. Les **168 cellules / 10,5 km² du centre** font partie de la livraison ; le **cache métropolitain complet reste explicitement hors Git**. Le futur site devra refléter cette différence et tester ses transitions de cellules, sans annoncer un cache absent. Aucune archive lourde n’a été reconstruite pendant ce relevé.

## Vérifications locales réellement observées

Deux répertoires statiques temporaires ont été servis à Chromium, sans changer les HTML :

- **DIVA PULSE** : bibliothèque et éditeur ouverts, retour à la bibliothèque, puis bouton natif Autoplay. Le navigateur observe `view: game`, audio en cours, scène disponible et morceau `NEON PROMISE`. Le HTML conserve le SHA-256 ci-dessus ; les requêtes au document et au manifeste répondent 200. Il s’agit d’une démonstration assistée courte, pas d’une validation de toutes les fonctions ou de la latence matérielle.
- **Dernière Ligne** : document, manifeste et icône répondent 200 ; le vrai menu « Poste stabilisé 0.44.2 » est affiché avec Campagnes, Modes de jeu, Dossiers et Options. La tentative automatique suivante attendait l’ancien sélecteur `newCampaign` avant d’ouvrir le nouveau menu Campagnes : ce contrôle n’a pas atteint le combat. Aucun succès de campagne ou de combat n’est donc revendiqué pour ce test d’hébergement. Le parcours complet reste à reprendre sur la future adresse publique.

Les résultats temporaires sont dans `/tmp/launcher-hosting-readiness/browser-smoke.json`. Aucun domaine public nouveau n’est déduit de ces tests locaux.

## Limite de ce relevé

Les identifiants, révisions, chemins et tailles ci-dessus proviennent de lectures ciblées de l’API GitHub et des sources publiques, sans clone massif. Les commandes proposées ne modifient pas les octets des jeux. Elles restent des réglages à appliquer et vérifier, pas la preuve qu’une adresse Vercel existe déjà ou que le compte dispose encore de son quota de déploiement. Le catalogue ne doit changer de destination qu’après vérification du titre, de l’empreinte de livraison et d’un parcours jouable sur le domaine réellement créé ou retrouvé.
