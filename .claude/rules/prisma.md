---
paths:
  - "prisma/**"
---
- JAMAIS modifier un fichier de migration deja applique
- Nouvelle migration pour chaque changement : `bunx prisma migrate dev --name description`
- Les enums necessitent parfois du SQL manuel (ALTER TYPE)
