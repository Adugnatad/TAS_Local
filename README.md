# TAS Corporate Portal — Monorepo

Cooperative bank corporate portal system for customer onboarding, signatory matrix management, and loan/trade CRM status tracking.

## Repository structure

| Folder | Application | Dev port | Description |
|--------|-------------|----------|-------------|
| [`internal-portal/`](./internal-portal/) | Internal Web | 3000 | Bank officer-facing CRM UI |
| [`customer-portal/`](./customer-portal/) | Customer Portal | 3001 | Corporate client-facing portal |
| [`backend/`](./backend/) | Portal Core API | 8080 | REST backend (Portal Core) |

## Quick start

Each app is independent for now. Navigate to the folder and follow its README.

```bash
cd internal-portal
npm install
npm run dev
```

## Integration plan

- **API contract:** Backend owns OpenAPI spec; both frontends consume generated types.
- **Local dev:** Each app runs standalone; MSW mocks API calls in frontends until backend is ready.
- **Future:** Add `packages/api-contracts` and workspace tooling (pnpm + Turborepo) when all three apps are active.

## Teams

| Area | Folder |
|------|--------|
| Internal Web | `internal-portal/` |
| Customer Portal | `customer-portal/` |
| Backend | `backend/` |
