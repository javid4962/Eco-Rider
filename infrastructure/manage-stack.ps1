<#
.SYNOPSIS
    EcoRide Infrastructure Stack Management Utility (PostgreSQL PostGIS + Redis)
.DESCRIPTION
    Manages the local developer infrastructure for EcoRide EV mobility platform.
    Ensures synthetic test-only credentials and named volume isolation.
.PARAMETER Action
    up     - Starts the PostGIS and Redis containers in the background.
    down   - Gracefully stops containers, preserving volume data.
    reset  - DESTRUCTIVE: Drops all containers and irreversibly deletes named volumes.
    status - Shows current container health and port mappings.
    verify - Runs live PostGIS spatial functions and Redis PING checks.
.PARAMETER Force
    Skips interactive confirmation when running destructive reset.
#>

param(
    [ValidateSet("up", "down", "reset", "status", "verify")]
    [string]$Action = "status",
    [switch]$Force
)

$ComposeFile = Join-Path $PSScriptRoot "docker-compose.dev.yml"

switch ($Action) {
    "up" {
        Write-Host "Starting EcoRide Dev Infrastructure (PostGIS + Redis)..." -ForegroundColor Cyan
        docker compose -f $ComposeFile up -d
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start Docker Compose infrastructure."
            exit $LASTEXITCODE
        }
        Write-Host "Waiting for service health checks..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        docker compose -f $ComposeFile ps
    }

    "down" {
        Write-Host "Gracefully stopping EcoRide Dev Infrastructure..." -ForegroundColor Cyan
        docker compose -f $ComposeFile down
        Write-Host "Containers stopped. Named volumes preserved." -ForegroundColor Green
    }

    "reset" {
        Write-Host ""
        Write-Host "==========================================================================" -ForegroundColor Red
        Write-Host " [CRITICAL WARNING] DESTRUCTIVE DATABASE & CACHE VOLUME RESET REQUESTED   " -ForegroundColor Red
        Write-Host "==========================================================================" -ForegroundColor Red
        Write-Host " This action will IRREVERSIBLY DELETE the following local Docker volumes:" -ForegroundColor Yellow
        Write-Host "  - ecoride_postgis_dev_data (All PostGIS tables, spatial geofences, trips)" -ForegroundColor Yellow
        Write-Host "  - ecoride_redis_dev_data   (All Redis keys, mutex locks, telemetry)" -ForegroundColor Yellow
        Write-Host " Only synthetic test data will be lost. Production resources are untouched." -ForegroundColor Cyan
        Write-Host "==========================================================================" -ForegroundColor Red
        Write-Host ""

        if (-not $Force) {
            $confirmation = Read-Host "Are you sure you want to completely erase local dev data? Type 'YES' to proceed"
            if ($confirmation -ne "YES") {
                Write-Host "Reset aborted by user. No volumes were modified." -ForegroundColor Green
                exit 0
            }
        }

        Write-Host "Removing containers and destroying named volumes..." -ForegroundColor Red
        docker compose -f $ComposeFile down -v
        Write-Host "Destructive reset complete. Volumes deleted." -ForegroundColor Green
    }

    "status" {
        Write-Host "EcoRide Infrastructure Status:" -ForegroundColor Cyan
        docker compose -f $ComposeFile ps
    }

    "verify" {
        Write-Host "Verifying PostGIS spatial function execution..." -ForegroundColor Cyan
        $spatialQuery = "SELECT ST_AsText(ST_MakePoint(83.2185, 17.6868)) as vizag_beach_road, round(ST_DistanceSphere(ST_MakePoint(83.2185, 17.6868), ST_MakePoint(83.3038, 17.7275))::numeric, 2) as distance_to_rushikonda_meters;"
        docker exec ecoride-postgis-dev psql -U ecoride_dev -d ecoride_db -c "$spatialQuery"
        if ($LASTEXITCODE -ne 0) {
            # Check fallback to ecoride-postgis if dev container name differs
            docker exec ecoride-postgis psql -U ecoride_dev -d ecoride_db -c "$spatialQuery"
        }

        Write-Host "`nVerifying Redis responsiveness..." -ForegroundColor Cyan
        docker exec ecoride-redis-dev redis-cli ping
        if ($LASTEXITCODE -ne 0) {
            docker exec ecoride-redis redis-cli ping
        }
    }
}

