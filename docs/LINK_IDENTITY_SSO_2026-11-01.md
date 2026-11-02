# Vérification d'identité des liens et redirections SSO — 1er novembre 2026

Ce rapport corrige une **erreur de classification HTTP** détectée pendant la recapture de Vortex Command : Vercel SSO répondait `200` **après une redirection vers `https://vercel.com/login`**. Le contrôle antérieur annonçant `140/140 accessibles` ne prouvait donc pas l'accès au jeu.

## Vérification comparée des 8 destinations

Contrôle réel depuis GitHub Actions le 1er novembre 2026 : [exécution des huit URLs](https://github.com/darknigthmare/launcher-applications/actions/runs/41313761976).

| Jeu | URL de lancement retenue | Résultat HTTP et titre du document | Ancien lien retenu ? |
| --- | --- | --- | --- |
| Brèche Multiverselle | https://multiverse-breach.vercel.app/ | 200 ; `Multiverse Breach - Retro Smash Crossover` ; identité concordante | Oui, ancienne adresse publique |
| Vortex Command | https://vortex-command.vercel.app/ | 200 ; `Vortex Command — Protocole Léviathan` ; identité concordante, moteur RTS lancé ensuite en navigateur | Oui, ancienne adresse publique |
| PREDATOR: HIVE WARRIORS | https://yautja-hive-warriors.vercel.app/ | 200 ; `HIVE WARRIORS — La chasse commence` ; identité concordante | Oui, ancienne adresse publique |
| Malaise Party | https://malaise-party-darknigthmares-projects.vercel.app/ | Redirige vers `vercel.com/login` puis répond 200. L'ancien `malaise-party.vercel.app` répond 404 | Non, domaine d'équipe conservé et signalé comme protégé |

Les **quatre** alias suffixés `-darknigthmares-projects.vercel.app` redirigeaient vers Vercel SSO en visite anonyme. Cette vérification ne prouve **pas** que les trois anciennes adresses publiques servent le SHA de production le plus récent : elle confirme leur identité HTML et l'absence de la page d'authentification.

## Corrections réellement livrées

- Les trois URL publiques validées ci-dessus sont à nouveau renseignées dans `index.html` et synchronisées pour les catalogues stockés localement.
- Malaise Party conserve son URL officiellement associée et porte le champ `accessPolicy: "vercel-sso"`. Le launcher indique **Connexion Vercel requise** et ne présente plus cette redirection comme une preuve de jouabilité publique.
- `scripts/check-live-links.mjs` inspecte désormais **l'adresse finale** après redirection. `scripts/link-destination-classifier.mjs` distingue les cas `reachable`, `auth-required`, `needs-review`, `broken` et `no-link`.
- Une suite de tests automatisés couvre le piège `HTTP 200 + SSO`, les redirections hors domaine et les erreurs HTTP.
- Nouveau contrôle : **139 URL sans redirection SSO détectée et une URL protégée**, ni 404 ni lien manquant. [Résultats réseau](https://github.com/darknigthmare/launcher-applications/actions/runs/41314151948).

## Restrictions à maintenir

Un `200` sur le bon nom de domaine n'est pas une preuve que le **dernier commit** est en production, qu'une **mission est jouable**, ou que l'illustration respecte le concept 1:1. Les captures avec preuve séparée restent la seule méthode adoptée pour qualifier les galeries. La recapture de Vortex 1.0 a été réalisée depuis son URL publique, plutôt que l'alias d'équipe protégé.

Ne pas désactiver le SSO de Malaise Party pour maquiller cette vérification et ne pas inventer d'alias public. Son authentification doit rester sous le contrôle du propriétaire du projet et du service Vercel. Le launcher statique ne possède pas les autorisations pour contourner un déploiement protégé.

Le **mode édition du launcher** est lui aussi une séparation visuelle, pas une authentification administrateur : les fichiers du dépôt statique restent accessibles directement. Un stockage privé et un contrôle serveur sont nécessaires pour garantir la restriction physique des archives.
