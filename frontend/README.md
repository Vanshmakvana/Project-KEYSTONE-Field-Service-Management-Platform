# KEYSTONE backend — React frontend ready

This backend is prepared specifically for the supplied `keystone-frontend`
project.  Its API returns the same field names as the frontend mock data, so
the React pages work without rewriting their service modules.

## What it includes

- JWT login returning `{ token, user }`, as required by `AuthContext.jsx`
- CORS for `http://localhost:5173`
- CRUD APIs for work orders, customers, inventory, and service requests
- Read API for technicians
- A frontend-shaped report summary
- PostgreSQL/Flyway schema and sample data

## Requirements

- Java **21** (not Java 8)
- Apache Maven 3.9+
- PostgreSQL 15+ running locally

There is intentionally no Maven wrapper in this project, so Maven must be
installed and available as `mvn`.

## 1. Create the database

In pgAdmin's Query Tool, connected as the PostgreSQL administrator, run:

```sql
CREATE USER keystone WITH PASSWORD 'keystone_secret';
CREATE DATABASE keystone_db OWNER keystone;
```

If the user/database already exists, keep it and use the credentials in
`src/main/resources/application.yml` instead. Flyway creates the tables and
sample data the first time the backend starts.

## 2. Start the backend

From this folder:

```powershell
mvn spring-boot:run
```

Wait until the console says the application started. The API is then running
at `http://localhost:8080/api`; Swagger is at
`http://localhost:8080/swagger-ui.html`.

## 3. Connect the supplied frontend

In the root of the frontend project, create a file called `.env` with exactly:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_REAL_API=true
```

Then start the frontend in a separate terminal:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Restart Vite after creating or changing `.env`.

## Login account

Use this manager account (it can use every supplied page, including Reports):

```text
Email: manager@keystone.io
Password: password
```

All development seed accounts use the same password: `password`.

## API paths

All protected paths need the JWT automatically attached by the supplied
frontend's `src/services/api.js`.

```text
POST   /api/auth/login
GET    /api/work-orders
GET    /api/work-orders/{workOrderCode}
POST   /api/work-orders
PUT    /api/work-orders/{workOrderCode}
DELETE /api/work-orders/{workOrderCode}

GET    /api/customers
POST   /api/customers
PUT    /api/customers/{customerId}
DELETE /api/customers/{customerId}

GET    /api/inventory
POST   /api/inventory
PUT    /api/inventory/{partId}
DELETE /api/inventory/{partId}

GET    /api/service-requests
POST   /api/service-requests
PUT    /api/service-requests/{requestCode}
DELETE /api/service-requests/{requestCode}

GET    /api/technicians
GET    /api/reports/summary
```

The Schedule screen, dashboard activity feed, global search, CSV export, and
charts are still deliberately local frontend features because that React app
does not call an API for them. All pages that use `src/services/` are backed by
this project.

## Development note

The CORS origin is deliberately restricted to Vite's local port. Before
deploying, replace `http://localhost:5173` in `SecurityConfig.java` with the
real frontend address and move database/JWT secrets into environment variables.
