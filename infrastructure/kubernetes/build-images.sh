#!/bin/bash
# Build Docker images for Kubernetes deployment
# This script must be run from the ledger/ directory (monorepo root)

set -e

echo "Building Docker images for Kubernetes..."
echo "Make sure you're in the ledger/ directory (monorepo root)"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the ledger/ directory."
    exit 1
fi

# Build backend image
echo "Building backend image..."
docker build -f backend/Dockerfile -t job-tracker-backend:latest .
echo "✅ Backend image built successfully"
echo ""

# Build frontend image
echo "Building frontend image..."
docker build -f frontend/Dockerfile -t job-tracker-frontend:latest .
echo "✅ Frontend image built successfully"
echo ""

# Build AI service image
echo "Building AI service image..."
docker build -f ai-service/Dockerfile -t job-tracker-ai:latest .
echo "✅ AI service image built successfully"
echo ""

echo "✅ All images built successfully!"
echo ""
echo "Next steps:"
echo "1. Copy secrets.yaml.example to secrets.yaml and fill in your actual secrets"
echo "2. Run: kubectl apply -f infrastructure/kubernetes/"
