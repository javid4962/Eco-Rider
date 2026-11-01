# EcoRide Operations Web Portal (`ops-web`)

Next.js operations and dispatch portal for the EcoRide EV mobility platform in Andhra Pradesh.

## Local Setup & Development

1. Install dependencies from repo root:
```powershell
pnpm install
```

2. Copy environment template:
```powershell
Copy-Item .env.example .env
```

3. Run development server:
```powershell
pnpm --filter ops-web dev
```

4. Build for production:
```powershell
pnpm --filter ops-web build
```

