# KEYSTONE — Field Service Management Platform (Frontend)

A complete React + Vite frontend for a commercial field-service management
SaaS product: work orders, service requests, technicians, scheduling,
customers, inventory, reports, and settings — built on realistic mock data
and structured to connect to a Spring Boot REST API later with no rewrites.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`) and sign in
with the demo credentials shown on the login screen:

```
Email:    admin@keystone.com
Password: admin123
```

## Project structure

```
src/
  components/
    layout/       Sidebar, Header, AppLayout, ProtectedRoute
    ui/            Reusable Modal, Drawer
    common/        PageHeader, FilterBar, Pagination, RowActions,
                    ConfirmDialog, EmptyState, StatusBadge
    dashboard/     KPI cards, trend chart, status donut, SLA monitor,
                    activity feed
    workorders/    Work order drawer + create/edit modal
  pages/           One file per route (Dashboard, WorkOrders, ...)
  services/        api.js (central request/config), createResourceService.js
                    (generic CRUD factory), plus one module per resource
  context/         AuthContext, ThemeContext, ToastContext
  hooks/           useLiveClock, useCountdown, useDebounce, useAnimatedNumber
  data/            mockData.js — realistic seed data for every resource
  styles/          theme.css (design tokens) + global.css
```

## Connecting the Spring Boot backend

Every data call in the app goes through `src/services/`. Right now
`VITE_USE_REAL_API` is unset (defaults to `false`), so each service reads
and writes an in-memory copy of the mock data in `src/data/mockData.js`,
with a short simulated delay so loading states behave honestly.

To switch to your real API:

1. Copy `.env.example` to `.env` and set:
   ```
   VITE_API_BASE_URL=https://your-api-host/api
   VITE_USE_REAL_API=true
   ```
2. That's it for reads/writes — `createResourceService.js` already calls
   the matching REST verbs (`GET/POST/PUT/DELETE /api/<resource>`) once
   `USE_REAL_API` is true. No component code changes.
3. For auth, `authService.js` has a `loginReal()` function already wired
   to `POST /api/auth/login`. It expects `{ token, user }` back and stores
   the JWT via `setToken()` in `src/services/api.js`. `api.js` already
   attaches `Authorization: Bearer <token>` to every request once a token
   is stored.
4. Expected REST endpoints (adjust paths in `createResourceService.js`
   calls if your backend differs):
   - `POST /api/auth/login`
   - `GET/POST /api/work-orders`, `PUT/DELETE /api/work-orders/{id}`
   - `GET/POST /api/service-requests`, `PUT/DELETE /api/service-requests/{id}`
   - `GET/POST /api/technicians`, `PUT/DELETE /api/technicians/{id}`
   - `GET/POST /api/customers`, `PUT/DELETE /api/customers/{id}`
   - `GET/POST /api/inventory`, `PUT/DELETE /api/inventory/{id}`
   - `GET /api/reports/summary`

## Notes

- Theme (dark/light), sidebar collapsed state, and settings preferences
  persist to `localStorage`.
- The CSV export on the Reports page generates a real file client-side
  from the current mock work order data.
- This build was assembled and syntax-checked in a sandboxed environment
  without npm registry access, so dependencies could not be installed or
  `vite build` run here. Relative imports and JSX brace/paren balance were
  verified programmatically across all 50 source files. Run `npm install`
  locally to pull dependencies and do a final check with `npm run build`.
