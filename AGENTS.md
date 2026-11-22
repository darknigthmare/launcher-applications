# Instructions pour les agents

<!-- BEGIN:shared-ai-tooling -->
## Outils de développement IA

Ce dépôt peut utiliser [Spec Kit](https://github.com/github/spec-kit),
[Superpowers](https://github.com/obra/superpowers) et, avec Claude Code,
[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios).

Lire le [guide d'intégration](.ai-tools/README.md) et les
[révisions de référence](.ai-tools/sources.json) avant leur première utilisation.

- **Spec Kit** : cadrer une fonctionnalité ou une évolution importante en
  spécification, plan et tâches ; réutiliser les documents et le suivi existants.
- **Superpowers** : choisir les pratiques pertinentes pour l'implémentation,
  le diagnostic, la revue et la vérification. Garder un seul plan de travail.
- **Claude Code Game Studios** : utiliser les agents spécialisés dans les
  sessions Claude Code pour les tâches de jeu concernées. Pour un autre type de
  projet, conserver cette possibilité sans imposer une organisation de studio.
- Adapter ces outils à la demande en cours et aux contrats du projet. Préserver
  l'architecture, les conventions, les consignes et les autorisations existantes.
- Vérifier leur disponibilité réelle avant d'annoncer une commande ou un plugin
  comme installé. Le guide fournit les étapes d'activation et un diagnostic local.

Ces consignes ajoutent des outils au projet ; leurs références externes ne
constituent pas une autorisation de modifier les permissions ou de publier.
<!-- END:shared-ai-tooling -->

<!-- BEGIN:3dviz-pro-max -->
## 3Dviz Pro Max

Pour une tâche de 3D, de perspective, de proportions, de caméra, de matériaux,
d'éclairage ou d'interaction spatiale, lire le
[skill complet 3dviz-pro-max](.ai-tools/3dviz-pro-max/skill/SKILL.md) et son
[guide d'intégration](.ai-tools/3dviz-pro-max/README.md).
La copie commune contient les données, références, scripts et modèles amont ;
les points d'entrée Codex et Claude Code sont dans `.agents/skills/3dviz-pro-max/`
et `.claude/skills/3dviz-pro-max/`.

Combiner les parties pertinentes avec les autres compétences déjà disponibles.
Reprendre les plans, le moteur, la direction artistique, les contrôles et les
autorisations du projet. Résoudre les chemins du skill depuis son dossier
commun. Vérifier les fichiers avec
`python3 -B .ai-tools/3dviz-pro-max/verify.py` et observer le rendu réel avant
de déclarer une amélioration visuelle. Les dépendances et outils facultatifs
du skill ne sont pas des dépendances à ajouter automatiquement au jeu.
<!-- END:3dviz-pro-max -->

<!-- BEGIN:codegraph-integration -->
## CodeGraph (complément des autres skills)

Pour explorer des symboles, dépendances, chemins d'appel ou l'impact d'un changement,
consulter d'abord [le skill CodeGraph](.agents/skills/codegraph/SKILL.md)
si le CLI/MCP CodeGraph est **réellement disponible** et que le projet est indexé.
Utiliser ensuite Spec Kit, Superpowers, les skills 3D et les autres outils du
dépôt selon le besoin. Ne pas remplacer les tests et les validations par un
résultat de graphe. En l'absence de CodeGraph, employer les outils classiques.

CodeGraph fonctionne **localement** : sa présence dans ce dépôt ne signifie
pas que le CLI ou le serveur MCP est installé sur la machine de l'agent.
<!-- END:codegraph-integration -->
