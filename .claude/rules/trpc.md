---
paths:
  - "apps/api/src/**/*.trpc.ts"
  - "apps/api/src/trpc/**/*.ts"
---
- Les classes .trpc.ts sont @Injectable() et enregistrees dans TrpcModule, PAS dans leur propre module
- Utiliser TRPCError (pas les exceptions NestJS) dans les procedures tRPC
- Toujours valider avec .input(ZodSchema) — ne pas faire de validation manuelle
