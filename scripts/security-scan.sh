#!/bin/bash

# Security scanning script for Eco_System
# This script runs comprehensive security checks using Snyk

set -e

echo "🔒 Starting comprehensive security scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Snyk is installed
if ! command -v snyk &> /dev/null; then
    print_error "Snyk CLI is not installed. Please run: npm install"
    exit 1
fi

# Check if user is authenticated with Snyk
if ! snyk auth --check &> /dev/null; then
    print_warning "Not authenticated with Snyk. Run 'snyk auth' to authenticate."
    print_warning "Continuing with local scan only..."
fi

# Run security audit for root workspace
echo "📦 Scanning root workspace..."
if npm run security:audit; then
    print_status "Root workspace security scan passed"
else
    print_error "Root workspace security scan failed"
    exit 1
fi

# Run security audit for backend
echo "🔧 Scanning backend workspace..."
if npm --workspace ecopath-backend run security:audit; then
    print_status "Backend security scan passed"
else
    print_error "Backend security scan failed"
    exit 1
fi

# Run security audit for frontend
echo "🎨 Scanning frontend workspace..."
if npm --workspace ecopath-frontend run security:audit; then
    print_status "Frontend security scan passed"
else
    print_error "Frontend security scan failed"
    exit 1
fi

# Run Snyk monitor (if authenticated)
if snyk auth --check &> /dev/null; then
    echo "📊 Monitoring dependencies with Snyk..."
    if npm run security:monitor; then
        print_status "Dependency monitoring completed"
    else
        print_warning "Dependency monitoring failed (non-critical)"
    fi
else
    print_warning "Skipping dependency monitoring (not authenticated)"
fi

print_status "Security scan completed successfully!"
echo ""
echo "💡 Tips:"
echo "   - Run 'snyk auth' to authenticate with Snyk for monitoring"
echo "   - Run 'npm run security:fix' to fix vulnerabilities interactively"
echo "   - Check .snyk file to ignore specific vulnerabilities"
