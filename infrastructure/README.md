# EcoRide Local Infrastructure Stack (PostgreSQL PostGIS + Redis)

This directory defines the authoritative local development multi-container stack for the EcoRide EV mobility platform in Andhra Pradesh.

---

## 1. Stack Components

| Service | Container Name | Image | Host Port | Internal Port | Local Named Volume | Healthcheck |
|---|---|---|---|---|---|---|
| **PostgreSQL / PostGIS** | `ecoride-postgis-dev` | `postgis/postgis:16-3.4` | `5432` | `5432` | `ecoride_postgis_dev_data` | `pg_isready -U ecoride_dev -d ecoride_db` |
| **Redis Cache / Mutex** | `ecoride-redis-dev` | `redis:7-alpine` | `6379` | `6379` | `ecoride_redis_dev_data` | `redis-cli ping` |

> [!IMPORTANT]
> **Synthetic Test-Only Credentials**: The credentials configured here (`ecoride_dev` / `ecoride_dev_secret`) are strictly for local offline development. Production credentials, live payment gateways, and live SMS OTP integrations are never permitted in local environment files.

---

## 2. PowerShell Stack Management

Use the PowerShell management script [`manage-stack.ps1`](file:///c:/Users/Javid/Desktop/eco_ride/infrastructure/manage-stack.ps1) or native Docker Compose commands:

### A. Start Infrastructure Stack (`up`)
Starts PostGIS and Redis containers in the background and waits for healthchecks:
```powershell
.\infrastructure\manage-stack.ps1 -Action up
# Or directly via docker compose:
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

### B. View Stack Health (`status`)
Inspect running containers, ports, and health status:
```powershell
.\infrastructure\manage-stack.ps1 -Action status
# Or directly:
docker compose -f infrastructure/docker-compose.dev.yml ps
```

### C. Gracefully Stop Infrastructure (`down`)
Stops all containers without deleting volume data:
```powershell
.\infrastructure\manage-stack.ps1 -Action down
# Or directly:
docker compose -f infrastructure/docker-compose.dev.yml down
```

### D. Destructive Stack Reset (`reset`)
> [!CAUTION]
> **DESTRUCTIVE OPERATION WARNING**: Running a stack reset with `-v` permanently destroys all local named volumes (`ecoride_postgis_dev_data` and `ecoride_redis_dev_data`). All local database tables, spatial geofences, captain records, and Redis keys will be irreversibly erased!
> 
> Only run this when resetting to a pristine development state.

Interactive confirmation required:
```powershell
.\infrastructure\manage-stack.ps1 -Action reset
```
To bypass the confirmation prompt in CI / automated test harnesses:
```powershell
.\infrastructure\manage-stack.ps1 -Action reset -Force
# Or directly:
docker compose -f infrastructure/docker-compose.dev.yml down -v
```

---

## 3. PostGIS Spatial & Redis Verification

### Verify PostGIS Spatial Function Execution:
Run a spatial query computing the spherical distance (in meters) between Visakhapatnam Beach Road (`83.2185°E, 17.6868°N`) and Rushikonda Beach (`83.3038°E, 17.7275°N`):
```powershell
.\infrastructure\manage-stack.ps1 -Action verify
```
Expected SQL Output:
```
           vizag_beach_road           | distance_to_rushikonda_meters 
--------------------------------------+-------------------------------
 POINT(83.2185 17.6868)               |                       10156.42
(1 row)
```

### Verify Redis Responsiveness:
```powershell
docker exec ecoride-redis-dev redis-cli ping
```
Expected Output:
```
PONG
```

