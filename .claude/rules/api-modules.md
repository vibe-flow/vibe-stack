---
paths:
  - "apps/api/src/modules/**/*.ts"
---
- @Inject() explicite sur chaque parametre de constructeur (tsx/Bun ne genere pas les metadata design:paramtypes)
- Un service = logique metier. Un .trpc.ts = routes. Ne pas melanger.
- Procedures tRPC : `trpc.procedure` (public), `trpc.protectedProcedure` (auth), `trpc.adminProcedure` (admin)
- Importer les schemas Zod depuis `@template-dev/shared`, jamais les redefinir localement
