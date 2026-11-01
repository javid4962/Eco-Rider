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

---

## Developer Scripts & Quality Gates (EV-013 Verified)

The monorepo provides standardized PowerShell-compatible developer commands for code formatting, linting, typechecking, Dart static analysis, unit/e2e testing, build compilation, dependency auditing, and secret scanning.

### Verified Commands Matrix

| Quality Check / Action | PowerShell Command | Verified Output / Gate | CI Enforcement |
|---|---|---|---|
| **Secret Scanning** | `pnpm run scan:secrets`<br>`powershell -ExecutionPolicy Bypass -File ./scripts/scan-secrets.ps1` | `Zero live credentials or secret leaks found` (0 findings) | **BLOCKING** on PR / Push |
| **Code Formatting** | `pnpm run format:check`<br>`pnpm run format:write` | `All matched files use Prettier code style` | **BLOCKING** on PR / Push |
| **Code Quality & Linting** | `pnpm run lint` | `0 errors, 0 warnings` across API & Ops Web | **BLOCKING** on PR / Push |
| **TypeScript Strict Check** | `pnpm run typecheck` | `tsc --noEmit` clean across `@ecoride/contracts`, `api`, `ops-web` | **BLOCKING** on PR / Push |
| **Dart Static Analysis** | `pnpm run analyze:dart`<br>`cd apps/rider_app; dart analyze; cd ../captain_app; dart analyze` | `No issues found!` across Rider and Captain apps | **BLOCKING** on PR / Push |
| **Backend Unit Tests** | `pnpm run test:unit` (or `pnpm run test`) | **104/104 tests passed** (11 test suites) | **BLOCKING** on PR / Push |
| **Flutter Mobile Tests** | `pnpm run test:flutter`<br>`cd apps/rider_app; flutter test; cd ../captain_app; flutter test` | Rider smoke test passed, Captain smoke test passed | **BLOCKING** on PR / Push |
| **Backend E2E Tests** | `pnpm run test:e2e` | **34/34 tests passed** (7 test suites) | **BLOCKING** on PR / Push |
| **Production Builds** | `pnpm run build` | `@ecoride/contracts`, `apps/api`, `apps/ops-web` compiled clean | **BLOCKING** on PR / Push |
| **Dependency Audit** | `pnpm run scan:deps` | Critical vulnerability gate verification | **BLOCKING** on PR / Push |
| **Master Verification** | `pnpm run verify:all`<br>`powershell -ExecutionPolicy Bypass -File ./scripts/verify-all.ps1` | Sequentially verifies all 10 checks with timing report | Local Pre-PR Gate |

### Master Verification Pipeline
To execute the complete pre-merge check locally on Windows:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/verify-all.ps1
```
Options:
- `-Fast`: Runs essential fast checks (secrets, formatting, linting, typechecks, unit tests, and builds), skipping E2E tests.
- `-SkipFlutter`: Runs backend and web verification, skipping mobile checks if Flutter SDK is not installed on host.

### Continuous Integration Architecture
The GitHub Actions workflow at [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) executes on every push and pull request targeting `main`, `master`, and `develop`:
1. **`lint-format-and-secrets`**: Validates secret scanning, Prettier code style, and ESLint quality.
2. **`typecheck`**: Strictly enforces TypeScript typechecks across all monorepo packages. Broken type definitions will fail and block merge.
3. **`flutter-quality`**: Sets up Flutter stable channel, runs `dart analyze`, and executes mobile unit/widget test suites.
4. **`backend-test`**: Boots live PostGIS 16 and Redis 7 service containers, executes TypeORM migrations, verifies synthetic demo data provisioning, and runs the entire Jest unit and E2E test suites. Any failing test will block merge.
5. **`build-and-audit`**: Generates optimized production bundles and executes dependency vulnerability audits.

