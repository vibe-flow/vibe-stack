---
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
---
- State global via Zustand stores dans `stores/`, pas de Context API ni Redux
- Donnees serveur via tRPC + TanStack Query, jamais fetch/axios direct
- Composants UI : shadcn/ui + Tailwind. Pas de CSS custom sauf necessite.
- Auth : utiliser les hooks de `useAuthStore` (useIsAuthenticated, useUser, etc.)
