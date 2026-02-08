@echo off
REM Build Docker images for Kubernetes deployment
REM This script must be run from the ledger\ directory (monorepo root)

echo Building Docker images for Kubernetes...
echo Make sure you're in the ledger\ directory (monorepo root)
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the ledger\ directory.
    exit /b 1
)

REM Build backend image
echo Building backend image...
docker build -f backend\Dockerfile -t job-tracker-backend:latest .
if %errorlevel% neq 0 (
    echo Failed to build backend image
    exit /b %errorlevel%
)
echo Backend image built successfully
echo.

REM Build frontend image
echo Building frontend image...
docker build -f frontend\Dockerfile -t job-tracker-frontend:latest .
if %errorlevel% neq 0 (
    echo Failed to build frontend image
    exit /b %errorlevel%
)
echo Frontend image built successfully
echo.

REM Build AI service image
echo Building AI service image...
docker build -f ai-service\Dockerfile -t job-tracker-ai:latest .
if %errorlevel% neq 0 (
    echo Failed to build AI service image
    exit /b %errorlevel%
)
echo AI service image built successfully
echo.

echo All images built successfully!
echo.
echo Next steps:
echo 1. Copy secrets.yaml.example to secrets.yaml and fill in your actual secrets
echo 2. Run: kubectl apply -f infrastructure\kubernetes\
