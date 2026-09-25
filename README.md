# SplitVault

SplitVault is a React/Vite dashboard backed by an Express API and PostgreSQL through Prisma.

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

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`
- `GET /api/pools`, `GET /api/pools/:poolId`, `POST /api/pools`, `PATCH /api/pools/:poolId`
- `GET /api/pools/:poolId/categories`, `POST /api/pools/:poolId/categories`
- `POST /api/pools/:poolId/claims`, `GET /api/pools/:poolId/claims`, `GET /api/claims/:claimId`
- `POST /api/claims/:claimId/approve`, `POST /api/claims/:claimId/reject`
- `GET /api/pools/:poolId/dashboard`

Protected endpoints require `Authorization: Bearer <token>`. Receipts currently store local/development file metadata (`filePath`, optional `fileName`, and `mimeType`) rather than uploading files.

## Testing

Run the backend tests with:

```powershell
cd server
npm test
```

The tests cover health/authentication boundaries and core claim validation. PostgreSQL-backed integration tests require a configured test database and should be run separately against that database.
