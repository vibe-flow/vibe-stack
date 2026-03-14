---
paths:
  - "packages/shared/src/**/*.ts"
---
- Tout schema ici est consomme par le frontend ET le backend — pas de dependances cote serveur (pas de Prisma, pas de Node APIs)
- Exporter les types inferes : `export type X = z.infer<typeof XSchema>`
- Ne pas dupliquer un schema qui existe deja — verifier l'index avant d'en creer un nouveau
