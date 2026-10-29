# start.ps1 - One-step start and verify script for Airline Reservation System
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AIRLINE RESERVATION SYSTEM - ONE-STEP LAUNCH & VERIFY   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check if Docker is running
Write-Host "`n[1/5] Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not ready"
    }
    Write-Host "  [OK] Docker daemon is running." -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Docker Desktop is not running. Please launch Docker Desktop and retry." -ForegroundColor Red
    exit 1
}

# 2. Check .env file
Write-Host "`n[2/5] Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  -> .env file not found. Initializing from .env.docker.example..." -ForegroundColor Cyan
    Copy-Item ".env.docker.example" ".env"
}
Write-Host "  [OK] .env file configured." -ForegroundColor Green

# 3. Start containers and wait for health
Write-Host "`n[3/5] Starting all 7 Docker containers with health checks..." -ForegroundColor Yellow
docker compose up -d --wait
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to start Docker Compose stack." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] All 7 containers are healthy!" -ForegroundColor Green

# 4. Run migrations and seeders
Write-Host "`n[4/5] Executing database migrations and seeders..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = "." }
& "$scriptDir\scripts\migrate-and-seed.ps1"

# 5. Run E2E test verification
Write-Host "`n[5/5] Running automated End-to-End acceptance tests..." -ForegroundColor Yellow
node "$scriptDir\scripts\test-e2e.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARNING] Some E2E tests reported errors." -ForegroundColor Red
} else {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: SYSTEM IS 100% OPERATIONAL AND READY FOR DEMO! " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  * API Gateway:        http://localhost:3004" -ForegroundColor White
    Write-Host "  * Aggregate Health:   http://localhost:3004/api/v1/health/aggregate" -ForegroundColor White
    Write-Host "  * RabbitMQ Dashboard: http://localhost:15672 (guest / guest)" -ForegroundColor White
    Write-Host "  * Flight Search API:  http://localhost:3000/api/v1/flight" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
}
