# SplitVault

SplitVault is a shared-expense and budget operations platform for organizations. It combines a React/Vite frontend with an Express API and PostgreSQL data layer managed through Prisma.

The application provides a modern dark fintech SaaS dashboard for monitoring shared budget pools, reviewing expense claims, and tracking spending by category.

## Key features

- **Multi-role authentication:** JWT-based authentication for Admin and Contributor users.
- **Shared Budget Pool Management:** Create and manage pools, categories, budgets, and pool membership.
- **Visual Expense Analytics:** Dashboard metrics and category-level donut chart breakdowns for budget allocation and spending.
- **Claim Verification Workflow:** Contributors submit expense claims and Admins approve or reject pending claims.
- **Modern Dark Fintech SaaS Dashboard UI:** Responsive app-shell layout with sidebar navigation, pool selection, claim forms, status badges, and financial widgets.

## Tech stack

- **Frontend:** React 19, Vite, custom CSS, and Orbitron typography.
- **Backend:** Node.js, Express 5, JWT authentication, bcrypt password hashing, and CORS.
- **Database:** PostgreSQL accessed through Prisma 7 and the PostgreSQL adapter.
- **Testing:** Node's built-in test runner and Supertest.

The repository is organized into separate `client` and `server` applications. The frontend communicates with the backend through the `/api` routes described below.

## Setup

### 1. Install dependencies

```powershell
cd server
npm install
cd ..\client
npm install
```

### 2. Create PostgreSQL

Create a PostgreSQL database named `splitvault`, or use an existing development database.

### 3. Configure the server

Copy `server/.env.example` to `server/.env` and set:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: a long random secret used to sign access tokens
- `PORT`: API port, default `5000`
- `CLIENT_ORIGIN`: frontend origin, default `http://localhost:5173`

The `.env` file is ignored by Git and must never contain committed credentials.

### 4. Create the schema and Prisma Client

```powershell
cd server
npx prisma migrate dev --name init
npm run prisma:generate
```

### 5. Seed development data

```powershell
npm run prisma:seed
```

Development accounts:

- `admin@splitvault.local` / `SplitVault123!`
- `contributor@splitvault.local` / `SplitVault123!`

Change these credentials before using the system outside local development.

### 6. Start the backend

```powershell
npm run dev
```

The API runs at `http://localhost:5000`.

### 7. Start the frontend

In a second terminal:

```powershell
cd client
npm run dev
```

The frontend uses `VITE_API_URL` when provided; otherwise it calls `http://localhost:5000/api`.

## Development workflow

Run the backend and frontend in separate terminals during development:

```powershell
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

For a production frontend build:

```powershell
cd client
npm run lint
npm run build
```

The server does not currently define separate `lint` or `build` scripts. Its available validation command is:

```powershell
cd server
npm test
```

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`
- `GET /api/pools`, `GET /api/pools/:poolId`, `POST /api/pools`, `PATCH /api/pools/:poolId`
- `GET /api/pools/:poolId/categories`, `POST /api/pools/:poolId/categories`
- `POST /api/pools/:poolId/claims`, `GET /api/pools/:poolId/claims`, `GET /api/claims/:claimId`
- `POST /api/claims/:claimId/approve`, `POST /api/claims/:claimId/reject`
- `GET /api/pools/:poolId/dashboard`

Protected endpoints require a bearer JWT in the `Authorization` header. Receipts currently store local/development file metadata (`filePath`, optional `fileName`, and `mimeType`) rather than uploading files.

## Testing

Run the backend tests with:

```powershell
cd server
npm test
```

The tests cover health/authentication boundaries and core claim validation. PostgreSQL-backed integration tests require a configured test database and should be run separately against that database.
