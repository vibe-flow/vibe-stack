# [Nom du projet]

## Projet

[Description du domaine metier et objectif du projet]

---

<!-- vibe-stack-plugin:conventions:start -->
<!-- Cette section est gérée par le plugin vibe-stack — https://github.com/vibe-flow/vibe-stack-plugin -->
<!-- Pour la mettre à jour, invoquer la skill `vibe-stack:sync-vibe-stack`. Ne pas modifier manuellement. -->

# Conventions vibe-stack

## Stack

- Monorepo Bun : `apps/web` (React/Vite), `apps/api` (NestJS)
- Validation : Zod uniquement (pas class-validator), schemas dans `packages/shared/src/schemas/`
- API : tRPC par defaut, REST si besoin externe
- ORM : Prisma, schema dans `prisma/schema.prisma`
- State management : Zustand (`stores/auth.store.ts`)
- Data fetching : TanStack Query (via tRPC)
- Tests : Vitest (unitaires et integration)
- Logging : Pino via `LoggerService`
- AI : Module unifie (`modules/ai/ai.service.ts`) — appels directs LiteLLM (chat, embeddings, structured extract)
- Python : Scripts standalone dans `scripts/python/`, appeles via `pythonService.runScript()`

## Ecosysteme

- `vibe-stack` : repo template, base de chaque nouveau projet
- `vibe-stack-modules` : repo de modules reutilisables (magic-link, stripe, etc.)
- `vibe-stack-plugin` : plugin Claude Code packageant les skills et conventions
- `.flow/` : dossier versionne dans chaque projet
  - `project.json` : identite du projet (name, stack)
  - `vibe-stack-lock.json` : tracking des imports (commit core + modules)
  - `deploy.json` : config de deploiement (cree par `vibe-stack:deploy-setup`)
- Skills (via plugin) : `vibe-stack:import-module`, `vibe-stack:export-module`, `vibe-stack:sync-vibe-stack`, `vibe-stack:deploy-setup`, `vibe-stack:deploy`

## Workflow Git

- **Trunk-based / GitHub Flow** : `main` est la seule branche longue (prod + integration) + branches courtes feature/fix
- **JAMAIS** de commit direct sur `main` (bloque par hook pre-commit)
- Toujours creer une branche depuis `main` : `feature/xxx` ou `fix/xxx`
- Utiliser des worktrees dans `.worktrees/` : `git worktree add .worktrees/feature-name main`
- Merger via PR

## Conventions

- Nouveaux modules API dans `apps/api/src/modules/`
- Structure standard d'un module backend :
  - `{module}.service.ts` (business logic)
  - `{module}.trpc.ts` (routes tRPC)
  - `{module}.module.ts` (NestJS module)
  - `__tests__/{module}.spec.ts` (tests Vitest)
- Schemas Zod partages dans `packages/shared/src/schemas/`
- Tests dans le meme dossier que le fichier teste : `*.spec.ts`
- Composants UI avec shadcn/ui + Tailwind
- State global via Zustand stores dans `apps/web/src/stores/`

## Verification du code

- **Utiliser `bun run lint:check`** (ESLint, leger)
- **Eviter `bunx tsc --noEmit`** (peut crash OOM sur gros projets)
- **`bun run dev` fonctionne** (tsx compile a la volee)

## Migrations Prisma

**IMPORTANT** : Regles strictes pour eviter les problemes de drift.

- Toujours `bunx prisma migrate dev --name description` pour creer une migration
- Creer une NOUVELLE migration pour tout changement, meme pour corriger une erreur
- **JAMAIS** modifier un fichier de migration deja applique (checksum = drift)
- **JAMAIS** utiliser `prisma db push` (modifie la base sans migration)
- **JAMAIS** utiliser `prisma migrate reset` sauf accord explicite

## Persistance d'etat UI

**Regle** : tout etat que l'utilisateur s'attend a retrouver au refresh doit etre persiste.

- **Filtres, tri, pagination, preferences de page** → `usePersistedState(key, default)` (`apps/web/src/hooks/use-persisted-state.ts`)
  - Persiste en localStorage, sync entre onglets
  - Sync BDD automatique si le module `user-preferences` est present
- **Parametres partageables par URL** (recherche, filtres principaux) → `useUrlState(key, default)` (`apps/web/src/hooks/use-url-state.ts`)
- **Preferences globales app** (sidebar, theme, densite) → `ui.store.ts` (hooks usePersistedState)
- **JAMAIS `useState` seul** pour un etat que l'utilisateur s'attend a retrouver au refresh
- `useState` reste OK pour l'etat purement ephemere : modals, loading, hover, animations, formulaires en cours
- Une regle ESLint `no-restricted-imports` warn sur `useState` pour forcer la reflexion

# Dossier `.flow/`

Chaque projet vibe-stack contient un dossier `.flow/` versionne qui fait le lien entre le repo local et Hub :

- **`project.json`** : identite du projet — `id` (correspond au project Hub), `name`, `stack`, `hubServiceKey` (cle d'auth MCP)
- **`vibe-stack-lock.json`** : tracking des imports depuis vibe-stack core et modules (commits, fichiers)
- **`deploy.json`** : config de deploiement (SSH, registry, Caddy, health check)

Le `project.json` est la piece maitresse : son `id` permet a Claude Code de savoir sur quel projet Hub il travaille quand il utilise les tools MCP.

## A eviter

- class-validator (utiliser Zod)
- localStorage direct pour l'auth (utiliser `useAuthStore`)
- Appels LLM directs (passer par AiService)
- Code Python dans NestJS (utiliser les scripts)
- Dependances hors workspace
- Jest (utiliser Vitest)
- `tsc --noEmit` pour type-checking (utiliser `bun run lint:check`)

<!-- vibe-stack-plugin:conventions:end -->
