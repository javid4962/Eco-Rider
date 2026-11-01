# EcoRide - EV-Only Mobility Platform (Andhra Pradesh)

Original EV-only mobility platform engineered with NestJS, PostgreSQL/PostGIS, Redis, Next.js, and Flutter.

---

## Architecture Overview (Four Applications)

| Application Shell | Directory | Framework / Language | Role & Purpose | Port / Target |
|---|---|---|---|---|
| **API Backend** | `apps/api` | NestJS 10, TypeORM, TypeScript | Authoritative backend, PostGIS spatial dispatch, BullMQ queues, LEDGER | `http://localhost:3000` |
| **Operations Web Portal** | `apps/ops-web` | Next.js 14 App Router, React 18, TypeScript | Dispatch operations, EV telemetry map, KYC queue, SLA monitoring | `http://localhost:3001` |
| **Rider Mobile App** | `apps/rider_app` | Flutter 3.44, Dart 3.12 | Passenger ride quotes, booking, active tracking, bilingual UI | iOS / Android / Web |
| **Captain Mobile App** | `apps/captain_app` | Flutter 3.44, Dart 3.12 | EV driver dispatch acceptance, battery feasibility, duty toggle | iOS / Android / Web |
| **Domain Contracts** | `packages/contracts` | TypeScript Strict | Shared DTOs, release bounds, design tokens, test matrix | Monorepo package |

---

## Windows PowerShell Local Setup

Follow these exact steps from a Windows PowerShell console:

### 1. Prerequisites Check
Ensure Node.js (>=20.0.0), pnpm (>=9.0.0), Docker Desktop, and Flutter (>=3.20.0) are available:
```powershell
node --version
pnpm --version
docker --version
docker-compose --version
flutter --version
```

### 2. Configure Environment Variables
Copy environment templates for all applications (synthetic dev-only credentials):
```powershell
Copy-Item .env.example .env
Copy-Item apps/ops-web/.env.example apps/ops-web/.env
Copy-Item apps/rider_app/.env.example apps/rider_app/.env
Copy-Item apps/captain_app/.env.example apps/captain_app/.env
```

### 3. Start Local Infrastructure (PostGIS & Redis)
Launch the containers via Docker Compose:
```powershell
docker compose up -d
docker compose ps
```

### 4. Install Dependencies
```powershell
pnpm install
```

### 5. Run Database Migrations (PostGIS Extension)
Execute TypeORM migrations to enable PostGIS and spatial schema:
```powershell
pnpm run migration:run
```

---

## Starting and Compiling All Four Applications

### 1. NestJS API Backend (`apps/api`)
```powershell
# Run unit & e2e tests:
pnpm run test
pnpm run test:e2e

# Compile production build:
pnpm --filter api build

# Start development server (Port 3000):
pnpm run start:dev
```

### 2. Next.js Operations Portal (`apps/ops-web`)
```powershell
# Compile production build:
pnpm --filter ops-web build

# Start development server (Port 3001):
pnpm --filter ops-web dev
```

### 3. Flutter Rider App (`apps/rider_app`)
```powershell
# Run widget and smoke tests:
pnpm run test:rider
# Or directly:
cd apps/rider_app; flutter test; cd ../..

# Compile/start app:
cd apps/rider_app; flutter run -d chrome  # or -d windows / android
```

### 4. Flutter Captain App (`apps/captain_app`)
```powershell
# Run widget and smoke tests:
pnpm run test:captain
# Or directly:
cd apps/captain_app; flutter test; cd ../..

# Compile/start app:
cd apps/captain_app; flutter run -d chrome  # or -d windows / android
```

### Monorepo Global Commands
```powershell
# Compile all web and backend apps:
pnpm run build

# Run linting across all web and backend workspaces:
pnpm run lint
```
