# EcoRide - EV-Only Mobility Platform (Andhra Pradesh)

Original EV-only mobility platform engineered with NestJS, PostgreSQL/PostGIS, Redis, Next.js, and Flutter.

---

## Windows PowerShell Local Setup

Follow these exact steps from an elevated or standard Windows PowerShell console:

### 1. Prerequisites Check
Ensure Node.js (>=20.0.0), pnpm (>=9.0.0), and Docker are available:
```powershell
node --version
pnpm --version
docker --version
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

### 3. Start Local Infrastructure (PostGIS & Redis)
Launch the containers via Docker Compose:
```powershell
docker compose up -d
```
Verify container health:
```powershell
docker compose ps
```

### 4. Install Dependencies
```powershell
pnpm install
```

### 5. Run Database Migrations (PostGIS Extension)
Execute TypeORM migrations to enable PostGIS and initial schema:
```powershell
pnpm run migration:run
```

### 6. Run Tests
Execute unit and integration tests:
```powershell
pnpm run test
```

### 7. Build the Application
Compile the NestJS TypeScript application:
```powershell
pnpm run build
```

### 8. Start the Development Server
```powershell
pnpm run start:dev
```

### 9. Verify API Health Endpoint
Probe the `/health` endpoint from PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:3000/health -Method Get | ConvertTo-Json -Depth 5
```
Expected response:
```json
{
  "status": "ok",
  "service": "ecoride-api",
  "timestamp": "2026-11-01T10:00:00.000Z",
  "dependencies": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```
*Note: Connection strings and credentials are sanitized and never exposed.*

