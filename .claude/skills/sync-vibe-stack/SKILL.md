---
name: sync-vibe-stack
description: Use when the user wants to check if their project is up to date with vibe-stack template and modules, or to pull upstream changes. Also use when the user says "sync", "mise à jour vibe-stack", "upgrade core", or asks about available vibe-stack updates.
disable-model-invocation: true
---

# Sync Vibe Stack

Synchronisation DOWNSTREAM uniquement : tirer les mises à jour de vibe-stack (core) et vibe-stack-modules vers le projet courant.

## Repos de référence

- Template vibe-stack : `~/Dev/vibe-stack/`
- Modules : `~/Dev/vibe-stack-modules/modules/`
- Lock file : `.flow/vibe-stack-lock.json` (dans le projet courant)
- Releases : `~/Dev/vibe-stack/.flow/releases.json` (registre des versions)

## Instructions

### Step 1 — Vérification du contexte

1. Vérifier que `.flow/vibe-stack-lock.json` existe dans le projet courant.
2. Si le fichier n'existe pas, répondre :
   > Ce projet n'a pas de lock file. Utilisez `/import-module` pour importer un module ou initialisez `.flow/` manuellement.
3. Lire et parser le contenu du lock file.
4. **Détecter le mode** :
   - Si `core.version` existe → **mode versionné**
   - Si seulement `core.commit` existe → **mode legacy** (migration nécessaire)

### Step 2 — Check core (mode versionné)

> Si le lock est en mode legacy, aller d'abord au **Step 2bis**.

1. Lire `~/Dev/vibe-stack/.flow/releases.json`.
2. Extraire `core.version` du lock file (ex: `"1.0.0"`).
3. Trouver la version actuelle du lock dans le tableau des releases.
4. Collecter toutes les releases **plus récentes** que la version lockée.
5. Si aucune release plus récente → noter "Core : à jour (vX.Y.Z)".
6. Sinon → collecter les releases manquantes.

### Step 2bis — Migration legacy → versionné

Si le lock contient `core.commit` mais pas `core.version` :

1. Lire `~/Dev/vibe-stack/.flow/releases.json`.
2. Trouver la release dont le `commit` correspond au `core.commit` du lock, ou la release la plus récente dont le commit est un ancêtre du `core.commit` :
   ```
   git merge-base --is-ancestor <release.commit> <lock.commit>
   ```
   (exécuté dans `~/Dev/vibe-stack/`)
3. Si aucune release ne correspond (commit trop ancien) → assigner la version `1.0.0` (baseline).
4. Informer l'utilisateur :
   > Migration du lock : votre projet était sur le commit `<hash>`, correspondant à la version `vX.Y.Z`. Le lock sera mis à jour en mode versionné.
5. Continuer avec le Step 2 en utilisant la version trouvée.

### Step 3 — Check modules

Pour chaque entrée dans `lock.modules` :

1. Extraire le `commit` du module.
2. Dans `~/Dev/vibe-stack-modules/`, exécuter :
   ```
   git log <module.commit>..HEAD --oneline -- modules/<module.name>/
   ```
3. Si aucun commit → noter "Module <name> : à jour".
4. Sinon → collecter la liste des commits et exécuter :
   ```
   git diff <module.commit>..HEAD --stat -- modules/<module.name>/
   ```

### Step 4 — Rapport

Afficher un rapport structuré :

```
Synchronisation — [nom du projet]

Core (vibe-stack) :
  [À jour vX.Y.Z | Mises à jour disponibles : vX.Y.Z → vA.B.C]

  Releases disponibles :
    v1.1.0 (moderate) — Résumé
    v2.0.0 (critical) — Résumé
      ⚠️ Release critique — breaking changes
      🗃️ Migration Prisma requise

Modules :
  <module-1> : [À jour | X commits de retard]
  <module-2> : [À jour | X commits de retard]
  ...
```

### Step 5 — Demander l'action

**Si au moins une release a `severity: "critical"`**, afficher un avertissement :

> ⚠️ Cette synchronisation inclut des releases critiques avec des breaking changes. Il est recommandé de travailler sur une branche dédiée. Voulez-vous créer une branche `sync/vibe-stack-vX.Y.Z` ?

Puis demander à l'utilisateur :

> Que veux-tu faire ?
> 1. Appliquer toutes les mises à jour
> 2. Appliquer seulement le core
> 3. Appliquer seulement un module spécifique
> 4. Voir le diff détaillé d'un élément
> 5. Ne rien faire

Si l'utilisateur accepte la branche dédiée, la créer depuis la branche courante avant d'appliquer.

Attendre la réponse avant de continuer.

### Step 6 — Appliquer les mises à jour

#### 6a — Pour le core (mode versionné)

**Appliquer les releases séquentiellement**, de la plus ancienne à la plus récente.

Pour chaque release à appliquer :

1. Obtenir le diff complet entre le commit de la release précédente et le commit de cette release :
   ```
   git diff <prev-release-commit>..<this-release-commit>
   ```
   (exécuté dans `~/Dev/vibe-stack/`)

2. Analyser le diff et appliquer intelligemment dans le projet courant. Ce n'est PAS un copier-coller — c'est une application intelligente qui tient compte des spécificités du projet (code custom, modules installés, structure existante).

3. **Notes d'intégration** : si la release a un champ `integration_notes` non vide, lire le lock file du projet (pour connaître les modules installés) puis exécuter ces instructions dans le contexte du projet. Ces notes couvrent les cas que le diff seul ne permet pas de gérer (module → core, core → module, changements de paradigme).

4. Si `migration: true`, prévenir l'utilisateur :
   > ⚠️ Cette release inclut des changements Prisma. Après le sync, vérifie ton schema et crée une migration.

5. Si `severity: "critical"`, demander confirmation à l'utilisateur avant d'appliquer chaque aspect majeur.

**Pendant l'application**, maintenir un journal interne de chaque action avec un statut :
- `ok` — appliqué sans problème
- `adapted` — appliqué avec des adaptations spécifiques au projet (noter lesquelles)
- `skipped` — non applicable au projet (expliquer pourquoi)
- `needs_review` — appliqué mais incertain, l'utilisateur devrait vérifier
- `question` — impossible de décider sans input de l'utilisateur

#### 6a-legacy — Pour le core (mode legacy, fallback)

Si aucune release ne couvre les changements (ex: commits entre deux releases) :

1. Exécuter dans `~/Dev/vibe-stack/` :
   ```
   git diff <locked-commit>..HEAD
   ```
2. Analyser les changements et appliquer intelligemment dans le projet courant.

#### 6b — Pour un module

1. Utiliser le mapping `files` du lock pour identifier les fichiers à comparer.
2. Pour chaque fichier, effectuer un merge 3-way :
   - **Base** = fichier du module au commit locké :
     ```
     git show <locked-commit>:modules/<name>/<file>
     ```
     (exécuté dans `~/Dev/vibe-stack-modules/`)
   - **Theirs** = fichier du module à HEAD :
     ```
     git show HEAD:modules/<name>/<file>
     ```
     (exécuté dans `~/Dev/vibe-stack-modules/`)
   - **Ours** = fichier actuel dans le projet courant (chemin depuis le mapping `files`)
3. Appliquer le merge fichier par fichier.
4. En cas de conflit, montrer le conflit à l'utilisateur et demander comment résoudre.

### Step 7 — Rapport post-sync

Avant de commiter, présenter un rapport de synthèse :

```
## Rapport de synchronisation

### ✅ Appliqué sans problème
- AiService refactoré pour appels directs LiteLLM
- Règle ESLint useState ajoutée
- ...

### 👀 À vérifier
- Auth magic-link : le projet avait un AuthService custom avec des méthodes supplémentaires. Vérifier la compatibilité.
- Migration Prisma nécessaire. Lancer `bunx prisma migrate dev` après validation.

### ❓ Questions
- Le projet a une RegisterPage custom avec des champs supplémentaires. La supprimer ou conserver ces champs ?

### Fichiers modifiés
apps/api/src/modules/ai/ai.service.ts
apps/api/src/modules/ai/ai.trpc.ts
...
```

**Règles :**
- "Appliqué sans problème" → concis, une ligne par changement
- "À vérifier" → contexte spécifique au projet, pas du générique
- "Questions" → uniquement les vrais bloquants
- S'il n'y a rien à vérifier et aucune question, dire : "Sync propre, aucun point d'attention."

**Attendre la validation de l'utilisateur** avant de passer au commit.

### Step 8 — Mettre à jour le lock et commiter

Une fois l'utilisateur satisfait :

1. Mettre à jour le lock :
   - Mode versionné : `core.version` = version de la dernière release appliquée. Supprimer `core.commit` et `core.date` s'ils existent.
   - Mode legacy : mettre à jour `core.commit` et `core.date`.
   - Pour chaque module mis à jour : mettre à jour `commit` et `date`.
   - NE PAS modifier le mapping `files` sauf si des fichiers ont été ajoutés/supprimés upstream.

2. Stager et commiter :
   ```
   git add .flow/vibe-stack-lock.json <fichiers modifiés>
   ```
   Message : `sync: upgrade vibe-stack core vX.Y.Z → vA.B.C`

3. NE PAS push.

4. Si on est sur une branche `sync/`, indiquer :
   > Sync commité sur `sync/vibe-stack-vX.Y.Z`. Pour merger : `git checkout develop && git merge sync/vibe-stack-vX.Y.Z`
