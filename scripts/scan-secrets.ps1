<#
.SYNOPSIS
    EcoRide Secret Scanner - Scans codebase for live credentials, API keys, and OTP bypasses.
.DESCRIPTION
    PowerShell-compatible script to inspect repository text files against security rules.
#>

param (
    [string]$RootDir = "."
)

$ErrorActionPreference = "Stop"

Write-Host "Running EcoRide Secret Scanner..." -ForegroundColor Cyan

# Rules
$Rules = @(
    @{ Name = "Razorpay Live Key"; Pattern = "rzp_live_[0-9a-zA-Z]{14,}"; Description = "Live Razorpay API credential" },
    @{ Name = "Stripe Live Key"; Pattern = "sk_live_[0-9a-zA-Z]{24,}"; Description = "Live Stripe secret key" },
    @{ Name = "AWS Access Key"; Pattern = "AKIA[0-9A-Z]{16}"; Description = "Live AWS Access Key" },
    @{ Name = "Private Key"; Pattern = "-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----"; Description = "Unencrypted private key" },
    @{ Name = "OTP Bypass"; Pattern = "(?:otp|start_otp|code)\s*(?:===|==)\s*['""](?:1234|0000|9999)['""]"; Description = "Hardcoded master OTP bypass" }
)

$IgnoredDirs = @(".git", "node_modules", "dist", ".next", "coverage", ".dart_tool", "build", "scratch", ".system_generated")
$ValidExtensions = @(".ts", ".tsx", ".js", ".dart", ".json", ".yml", ".yaml", ".md", ".sql", ".env", ".example", ".ps1")

$Files = Get-ChildItem -Path $RootDir -Recurse -File | Where-Object {
    $item = $_
    $skip = $false
    foreach ($ignored in $IgnoredDirs) {
        if ($item.FullName -match "[\\/]$ignored[\\/]") {
            $skip = $true
            break
        }
    }
    if ($skip) { return $false }
    if ($item.Name -eq "pnpm-lock.yaml" -or $item.Name -eq "scan-secrets.ts" -or $item.Name -eq "scan-secrets.ps1" -or $item.Name -eq "scan-secrets.spec.ts") {
        return $false
    }
    $ext = [System.IO.Path]::GetExtension($item.Name).ToLower()
    return ($ValidExtensions -contains $ext -or $item.Name -like ".env*")
}

$Violations = @()

foreach ($file in $Files) {
    $lines = Get-Content -Path $file.FullName
    $lineNum = 1
    foreach ($line in $lines) {
        foreach ($rule in $Rules) {
            if ($line -match $rule.Pattern) {
                $Violations += [PSCustomObject]@{
                    File = $file.FullName
                    LineNumber = $lineNum
                    Rule = $rule.Name
                    Description = $rule.Description
                    Preview = $line.Trim()
                }
            }
        }
        $lineNum++
    }
}

if ($Violations.Count -gt 0) {
    Write-Host "Secret scan FAILED! Found $($Violations.Count) violation(s):" -ForegroundColor Red
    foreach ($v in $Violations) {
        Write-Host "  - [$($v.Rule)] $($v.File):$($v.LineNumber)" -ForegroundColor Red
        Write-Host "    Line: $($v.Preview)" -ForegroundColor Gray
    }
    exit 1
} else {
    Write-Host "Secret scan PASSED: Zero live credentials or secret leaks found." -ForegroundColor Green
    exit 0
}

