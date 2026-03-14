---
paths:
  - "**/*.spec.ts"
  - "**/__tests__/**"
---
- Framework : Vitest (imports depuis 'vitest', pas 'jest')
- Tests a cote du code : `__tests__/{module}.spec.ts`
- Pour les tests d'integration API : utiliser le TestingModule NestJS avec PrismaService reel
