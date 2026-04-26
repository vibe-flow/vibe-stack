# Vibe Stack

Full-stack TypeScript monorepo template.

## Stack

- **Runtime**: Bun (workspace monorepo)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: NestJS + tRPC + Prisma + PostgreSQL
- **Validation**: Zod (shared schemas)

## Quick Start

```bash
# 1. Create repo from this template on GitHub
# 2. Clone and install
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Run migrations and seed
bunx prisma migrate dev
bunx prisma db seed

# 5. Start dev servers (API + Web)
bun run dev
```

## Project Structure

```
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Zod schemas + shared types
├── prisma/           # Schema and migrations
├── .flow/            # Project identity and tracking
└── CLAUDE.md         # AI assistant instructions
```

## Claude Code Plugin

This template ships with a companion [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) plugin that provides skills for syncing, deployment, module management and more.

```bash
# Add the marketplace
claude plugin marketplace add vibe-flow/vibe-stack-plugin

# Install the plugin
claude plugin install vibe-stack@vibe-stack
```

Once installed, the following skills become available in Claude Code:

- `vibe-stack:init-project`, `vibe-stack:import-module`, `vibe-stack:export-module`
- `vibe-stack:sync-vibe-stack`, `vibe-stack:upstream-vibe-stack`
- `vibe-stack:deploy-setup`, `vibe-stack:deploy`, `vibe-stack:release`, `vibe-stack:hotfix`
- `vibe-stack:help` — full list

Plugin source: https://github.com/vibe-flow/vibe-stack-plugin

## Default Credentials

After seeding: `admin@example.com` / `Admin123!`

## License

MIT
