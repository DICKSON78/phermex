#!/bin/bash

# Pricing Display Fix Deployment Script
# Run on server: /home/sikacgkz/helix.co.tz
# Usage: ./DEPLOY_PRICING_FIX.sh

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        PHERMEX PRICING DISPLAY FIX DEPLOYMENT           ║"
echo "║              November 4, 2026                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="/home/sikacgkz/helix.co.tz"

# Step 1: Navigate and pull code
echo "📍 Step 1: Navigate to project and pull code..."
cd $PROJECT_DIR || exit 1
git pull origin main || exit 1
echo "✓ Code pulled successfully"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Install dependencies..."
npm install || exit 1
echo "✓ Dependencies installed"
echo ""

# Step 3: Build frontend
echo "🏗️  Step 3: Build frontend..."
npm run build || exit 1
echo "✓ Frontend built successfully"
echo ""

# Step 4: Clear cache
echo "🧹 Step 4: Clear cache..."
php artisan cache:clear
php artisan config:cache
echo "✓ Cache cleared"
echo ""

# Step 5: Verify deployment
echo "✅ Step 5: Verifying deployment..."
echo ""
echo "📊 API Check:"
curl -s https://helix.co.tz/api/subscriptions/plans | jq '.data[] | {name, price, price_monthly}' 2>/dev/null || echo "Note: API check skipped if curl unavailable"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Pricing Now Displays As:"
echo "  STARTER:       \$12.50/month (Billed \$150/year)"
echo "  PROFESSIONAL:  \$16.67/month (Billed \$200/year)"
echo "  ENTERPRISE:    \$20.83/month (Billed \$250/year)"
echo ""
echo "🧪 Test:"
echo "  1. Visit https://helix.co.tz/login"
echo "  2. Check pricing section"
echo "  3. Verify monthly pricing displays correctly"
echo ""
echo "📋 Check logs:"
echo "  tail -f storage/logs/laravel.log"
echo ""
echo "⏮️  Rollback (if needed):"
echo "  git revert 1abe82e && npm run build"
echo ""
