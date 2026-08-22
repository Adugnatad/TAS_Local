# Internal Portal (Bank Officer Web)

Bank-officer-facing module of the TAS Corporate Portal.

## Features

- **Customer Onboarding** — Create/manage corporate customer profiles with role-gated approval
- **Signatory Matrix** — Configure signatories, approval rules, and preview valid combinations
- **CRM Status Viewer** — Read-only loan/trade request tracking (CoopStream + TSS)

## Tech stack

Next.js 14 · TypeScript · Tailwind · shadcn/ui · React Hook Form · Zod · TanStack Query · Zustand · MSW · Vitest · Playwright

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Sign in at `/login` — select a role to simulate RBAC:

| Role | Permissions |
|------|-------------|
| Officer | Create/edit drafts, submit for review |
| Supervisor / Admin | Approve/reject onboarding, full CRUD |

## Scripts

```bash
npm run dev          # Dev server (MSW active)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright smoke tests
```

First-time e2e setup:

```bash
npx playwright install chromium
npm run test:e2e
```

## Architecture

```
Pages/Components → feature hooks → api.ts → apiClient → MSW (dev) / Backend (prod)
```

- MSW intercepts `/api/*` in development
- Swap to real backend by setting `NEXT_PUBLIC_API_URL` and disabling MSW
- Auth is mocked via Zustand session store — replace `useSession` for production auth

## Backend integration

When Portal Core is ready:

1. Set `NEXT_PUBLIC_API_URL` in `.env.local`
2. Set `NEXT_PUBLIC_USE_MSW=false`
3. Replace mock auth in `src/features/auth/`

No component changes required — only the data-fetching and auth layers.

## Mock API endpoints

| Method | Path |
|--------|------|
| POST | `/api/auth/login` |
| GET | `/api/customers` |
| GET/PUT | `/api/customers/:id` |
| GET/POST/PUT | `/api/customers/:id/signatories` |
| GET/POST/PUT/DELETE | `/api/customers/:id/signatory-rules` |
| POST | `/api/customers/:id/signatory-matrix/preview` |
| GET | `/api/requests` |
| GET | `/api/requests/:id` |
