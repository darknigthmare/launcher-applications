# Accès directs aux jeux — relevé du 13 novembre 2026

Le catalogue actuel contient **158 fiches, dont 145 jeux**. La demande est d’ouvrir les jeux dans leur version web, sans orienter le joueur vers une installation. Les liens déjà présents ont été contrôlés et les cinq distributions GitHub restantes ont fait l’objet d’une recherche authentifiée spécifique.

## Contrôle de toutes les destinations actuelles

Commande exécutée avec le proxy hérité pris en charge par Node :

```sh
NODE_USE_ENV_PROXY=1 npm run links:check
```

Le [rapport complet](link-proof/live-links-2026-11-13.json) retrouve **152 destinations accessibles**, **5 dépôts accessibles pour téléchargement**, **1 accès nécessitant une connexion Vercel** (Malaise Party), **0 lien cassé** et **0 cas réseau indéterminé**. Les 152 accessibles comprennent des outils et applications ; ce nombre n’est pas un décompte de 152 jeux validés. Une réponse HTTP ne prouve pas à elle seule que tous les modes du jeu fonctionnent.

## Recherche des cinq versions web manquantes dans les fiches

Le compte Vercel connecté donne accès à une équipe : `darknigthmares-projects`, plan Hobby. La recherche a couvert **164 projets distincts**, **154 projets distincts liés à GitHub** et **857 alias**, en neuf pages. Le contexte Git renvoie 155 lignes car `the-house-of-the-dead-25d` y est répété. Aucun domaine personnalisé n’est déclaré dans cet inventaire d’alias.

| Fiche | Dépôt source exact | Résultat dans le compte connecté |
| --- | --- | --- |
| DIVA PULSE | `darknigthmare/Diva-Pulse` | Aucun projet Git lié ni alias du jeu retrouvé ; aucune homepage dans le dépôt |
| Dernière Ligne — Zéro Repli | `darknigthmare/The-Horde-The-Last-Stand` | Aucun projet Git lié ni alias du jeu retrouvé ; le README décrit le HTML local |
| Fallout Marseille — Mistral | `darknigthmare/fallout-Marseille` | Aucun projet Git lié ni alias du jeu retrouvé ; le README décrit un serveur local et des cartes embarquées |
| Parallaxe — Protocole 9 | `darknigthmare/Parallaxe_Protocole9` | Aucun projet Vercel lié ; le site documenté `parallaxe-protocole-neuf.darknigthmare.chatgpt.site` répond **403** |
| Massilia Cyberpunk | `darknigthmare/massilia-cyberpunk` | Aucun projet Git lié ni alias du jeu retrouvé ; `soma-massilia` est un autre produit |

Les dix projets non liés à Git sont trois laboratoires Xion, deux artefacts Reclaimed et cinq collections d’août déjà identifiées. Ils ne constituent pas une correspondance nominale des cinq jeux ci-dessus. Les recherches ont également couvert les variantes de noms `pulse`, `last-stand`, `mistral`, `protocole`, `marseille`, `studio`, `derniere` et les alias de compte.

La [preuve structurée de découverte](link-proof/local-games-vercel-discovery-2026-11-13.json) conserve les compteurs, sources, révisions de README, exclusions et limites. Ce relevé établit l’absence de correspondance **dans le compte connecté**, pas l’inexistence absolue d’une URL dans un autre compte.

## Identités à conserver séparément

`https://soma-massilia.vercel.app/` répond HTTP 200 et affiche **SOMA//MASSILIA — La Chair sous Licence**. Ce jeu possède son propre dépôt `soma-massilia` et sa fiche existante. Il ne doit pas remplacer Massilia Cyberpunk, le moteur géographique local, au seul motif qu’ils partagent un sous-titre.

Le site Parallaxe documenté existe, mais son HTTP 403 n’établit pas un accès public. Une page de connexion, un dépôt GitHub ou un nom de domaine déduit ne sont pas présentés comme un bouton « Jouer » vérifié.

Aucune adresse n’a donc été inventée pour ces cinq fiches pendant cet audit. Une publication web effective ou une URL de jeu extérieure au compte connecté permettra de remplacer chaque destination après vérification de son identité réelle. Les preuves des captures locales restent inchangées : elles ne deviennent pas des captures de production par une simple modification du lien.

## Comportement de lancement retenu

Les cinq dépôts restent les références de provenance, sans devenir des cibles du bouton Jouer. Tant qu’une adresse web publique exacte n’est pas confirmée, leur contrôle de lancement est désactivé et indique **« Adresse web à confirmer »**. La fiche n’invite plus à installer le jeu. Une future URL fournie ou publiée doit encore être confrontée à la bonne identité avant activation.

## Autre accès déjà protégé

Malaise Party est le seul cas d’authentification du relevé global. Son alias d’équipe sert Vercel SSO et le domaine court réellement déclaré `https://malaise-party.vercel.app/` répond **404**. Le projet annonce un dernier déploiement de production en erreur. Le domaine court n’est donc pas substitué au lien protégé sans jeu public confirmé.

## Candidat repéré hors de ce lot

Le nouveau dépôt [ImperiumMarch](https://github.com/darknigthmare/ImperiumMarch) correspond à **ORDRE DE CENDRE**, un prototype original de combat tactique 2D. Le README courant décrit la version **0.12.0**, Sera Vey, l’Empire d’Orthe et onze missions de campagne ; il distingue cette tranche de la campagne complète encore à construire. Le projet Vercel `imperium-march` est lié à ce dépôt et son déploiement `dpl_5QCqm8qWwfcGuSvrgteNznwCZ5x7` est READY, cible production.

Le contrôle public de `https://imperium-march.vercel.app/` répond HTTP **200**, titre **« ORDRE DE CENDRE — ImperiumMarch »**. Cette identité documentaire et HTTP permet une future intégration vérifiée ; aucun nouveau parcours de campagne n’a été testé dans ce relevé. Aucune fiche n’est ajoutée dans ce lot consacré aux illustrations, textes et accès déjà catalogués.

`Melcreation`, autre nouveau projet Vercel, est une vitrine de créations artisanales, pas un jeu. Il ne devient pas une fiche de jeu par analogie de date de création.

## Recherche directe par nom après précision de l’utilisateur

L’utilisateur a indiqué que les versions Vercel portent généralement le nom du jeu. En complément de l’inventaire du compte, **30 variantes directes** ont donc été testées en HTTPS : nom du dépôt, variantes sans tirets, titre français et suffixe d’équipe.

Le [rapport des variantes](link-proof/name-variant-probes-2026-11-13.json) consigne chaque URL, statut, destination finale et titre observé. Résultat : **27 HTTP 404** et **3 HTTP 200 appartenant à d’autres produits**.

| URL répondant 200 | Identité réelle constatée | Décision |
| --- | --- | --- |
| `https://the-horde.vercel.app/` | **Orc Society** | Ne correspond pas à Dernière Ligne — Zéro Repli |
| `https://parallaxe.vercel.app/` | Comparaison des convictions avec les votes réels de l’Assemblée | Ne correspond pas au jeu Protocole 9 |
| `https://massilia.vercel.app/` | Association de solidarité France–Guinée | Ne correspond pas au jeu Cyberpunk |

Les variantes exactes `diva-pulse`, `the-horde-the-last-stand`, `fallout-marseille`, `parallaxe-protocole9` et `massilia-cyberpunk`, ainsi que les alternatives listées dans le rapport, ne fournissent pas de jeu public vérifié. Le bouton de lancement ne doit donc être activé pour aucune de ces trois pages étrangères simplement parce que leur nom paraît proche.
