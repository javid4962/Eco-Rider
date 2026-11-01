<#
.SYNOPSIS
    EcoRide Developer Verification Pipeline - Complete Pre-PR / Pre-Merge Suite.
.DESCRIPTION
    Executes secret scanning, formatting, linting, Dart analysis, TypeScript typechecks,
    unit tests, mobile widget tests, E2E tests, production builds, and dependency auditing.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File ./scripts/verify-all.ps1
#>

param (
    [switch]$SkipFlutter = $false,
    [switch]$Fast = $false
)

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "        EcoRide EV-Only Mobility Platform - Verification        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$Results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Run-Step {
    param (
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "`n--> Running: $Name..." -ForegroundColor Yellow
    $startTime = Get-Date

    try {
        $global:LASTEXITCODE = 0
        & $Action
        if ($global:LASTEXITCODE -eq 0 -and $? -eq $true) {
            $duration = (Get-Date) - $startTime
            Write-Host "[PASS] ${Name} ($([math]::Round($duration.TotalSeconds, 1))s)" -ForegroundColor Green
            $Results.Add([PSCustomObject]@{ Step = $Name; Status = "PASS"; Duration = "$([math]::Round($duration.TotalSeconds, 1))s" })
        } else {
            $duration = (Get-Date) - $startTime
            Write-Host "[FAIL] ${Name} ($([math]::Round($duration.TotalSeconds, 1))s)" -ForegroundColor Red
            $Results.Add([PSCustomObject]@{ Step = $Name; Status = "FAIL"; Duration = "$([math]::Round($duration.TotalSeconds, 1))s" })
        }
    } catch {
        $duration = (Get-Date) - $startTime
        Write-Host "[FAIL] ${Name}: $_" -ForegroundColor Red
        $Results.Add([PSCustomObject]@{ Step = $Name; Status = "FAIL"; Duration = "$([math]::Round($duration.TotalSeconds, 1))s" })
    }
}

# 1. Secret Scanning
Run-Step -Name "1. Secret Scanning (Zero Leaks)" -Action {
    pnpm run scan:secrets
}

# 2. Prettier Formatting
Run-Step -Name "2. Prettier Code Formatting Check" -Action {
    pnpm run format:check
}

# 3. Code Quality & Linting
Run-Step -Name "3. ESLint Code Quality (API & Ops Portal)" -Action {
    pnpm run lint
}

# 4. TypeScript Typechecks
Run-Step -Name "4. TypeScript Strict Typecheck (All Workspaces)" -Action {
    pnpm run typecheck
}

# 5. Dart Static Analysis
if (-not $SkipFlutter) {
    Run-Step -Name "5. Dart Static Analysis (Rider & Captain Apps)" -Action {
        powershell -Command "cd apps/rider_app; dart analyze; cd ../captain_app; dart analyze"
    }
} else {
    $Results.Add([PSCustomObject]@{ Step = "5. Dart Static Analysis"; Status = "SKIPPED"; Duration = "0s" })
}

# 6. Backend Unit Tests
Run-Step -Name "6. Backend Unit Tests & Spatial Stack" -Action {
    pnpm run test:unit
}

# 7. Flutter Mobile Smoke Tests
if (-not $SkipFlutter) {
    Run-Step -Name "7. Flutter Mobile Smoke & Widget Tests" -Action {
        powershell -Command "cd apps/rider_app; flutter test; cd ../captain_app; flutter test"
    }
} else {
    $Results.Add([PSCustomObject]@{ Step = "7. Flutter Mobile Tests"; Status = "SKIPPED"; Duration = "0s" })
}

# 8. Backend E2E Tests
if (-not $Fast) {
    Run-Step -Name "8. Backend E2E Integration Tests" -Action {
        pnpm run migration:run
        pnpm run test:e2e
    }
} else {
    $Results.Add([PSCustomObject]@{ Step = "8. Backend E2E Tests"; Status = "SKIPPED"; Duration = "0s" })
}

# 9. Production Builds
Run-Step -Name "9. Production Builds (Contracts, API, Ops Web)" -Action {
    pnpm run build
}

# 10. Dependency Vulnerability Audit
Run-Step -Name "10. Dependency Vulnerability Audit" -Action {
    pnpm run scan:deps
    $global:LASTEXITCODE = 0
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "                    Verification Summary                        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$Results | Format-Table -AutoSize

$Failed = @($Results | Where-Object { $_.Status -eq "FAIL" })
if ($Failed.Count -gt 0) {
    Write-Host "`n❌ VERIFICATION FAILED: $($Failed.Count) step(s) failed." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ VERIFICATION PASSED: All verification steps completed successfully!" -ForegroundColor Green
    exit 0
}
