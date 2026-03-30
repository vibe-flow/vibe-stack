---
name: release-vibe-stack
description: Publier une nouvelle version de la vibe-stack avec tag git, notes de version et instructions d'intégration pour le sync. Utiliser quand l'utilisateur veut release, publier une version, tagger la vibe-stack.
disable-model-invocation: true
---

# Release Vibe Stack

Publie une nouvelle version sémantique de la vibe-stack (core). Crée un tag git et génère les notes de version dans `.flow/releases.json`.

Ce skill doit être exécuté depuis le repo `~/Dev/vibe-stack/`.

## Workflow

### 1. Vérifier le contexte

Vérifier qu'on est dans `~/Dev/vibe-stack/` et qu'il n'y a pas de changements non commités. Si oui, proposer de les commiter avant de continuer.

### 2. Analyser les changements

Lire `.flow/releases.json` pour trouver la dernière version et son commit. Si le fichier n'existe pas ou est vide, partir de `1.0.0`.

Analyser les commits (`git log`) et le diff (`git diff`) depuis le commit de la dernière release. S'il n'y a aucun commit, arrêter.

### 3. Déterminer la sévérité

**IMPORTANT** : Poser explicitement la question à l'utilisateur :

> Y a-t-il des breaking changes dans cette release ?

Ne PAS deviner. Les critères de breaking change sont :
- Changement du système d'authentification
- Suppression ou remplacement d'un module core
- Changement de schema Prisma incompatible
- Changement d'API publique d'un service utilisé par les projets
- Suppression d'une fonctionnalité
- Changement de dépendances qui casse les imports

Le bump semver :
- **major** : au moins un breaking change
- **minor** : ajouts de fonctionnalités, pas de breaking
- **patch** : corrections, refactoring interne sans impact

### 4. Proposer la release

Rédiger un résumé concis (1-2 phrases) de la release. Présenter le draft :

```
📦 Release vX.Y.Z (severity: critical|moderate|low)

Résumé : ...

Migration Prisma : oui/non

Notes d'intégration :
  [le contenu ou "aucune"]
```

Demander validation : valider, modifier, ou annuler.

### 5. Notes d'intégration

Les notes d'intégration ne contiennent que ce que Claude **ne peut pas déduire du diff**. Le skill `/sync-vibe-stack` a accès au diff complet entre les deux commits — il n'a pas besoin qu'on lui liste les fichiers modifiés ni qu'on lui dise d'ajouter un module dans AppModule.

Les notes sont utiles uniquement pour :
- **Module → Core** : un module vibe-stack-modules est remplacé par du code dans le core (ex: magic-link). Le sync doit savoir qu'il faut supprimer le module du lock.
- **Core → Module** : du code du core est extrait en module séparé (ex: langgraph). Le sync doit savoir qu'il faut installer le module via `/import-module`.
- **Changements de paradigme** : un pattern fondamental change (ex: password → magic-link) et le projet a potentiellement du code custom à préserver.

Si la release n'a aucun de ces cas, `integration_notes` est vide. Pour les releases `low` et la plupart des `moderate`, il sera vide.

### 6. Écrire et tagger

Insérer la release **au début** du tableau dans `.flow/releases.json` :

```json
{
  "version": "X.Y.Z",
  "date": "YYYY-MM-DD",
  "commit": "<HEAD hash>",
  "summary": "<résumé concis>",
  "severity": "critical|moderate|low",
  "migration": true|false,
  "integration_notes": "<notes ou chaîne vide>"
}
```

**Sévérité** :
- `critical` : breaking changes, migration manuelle obligatoire. `/sync-vibe-stack` affiche un warning et propose une branche dédiée.
- `moderate` : ajouts significatifs, migration Prisma possible, vérification recommandée.
- `low` : corrections mineures, sync safe.

Commiter avec le message `release: vX.Y.Z`, créer le tag `vX.Y.Z`.

Ne **pas** push automatiquement. Indiquer : `git push && git push --tags`
