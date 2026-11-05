#!/bin/bash
#
# Deploy the committed website build to the live web root.
# Run on the server after: git pull origin main
#
# The production server has no Node/npm, so dist/ is built locally, committed
# to git, and copied here into public/website/ (the actual web root).

set -euo pipefail

ROOT="${HELIX_ROOT:-/home/sikacgkz/helix.co.tz}"
cd "$ROOT"

echo "🚀 Starting Helix website deployment..."

if [ ! -f "dist/index.html" ] || [ ! -d "dist/assets" ]; then
    echo "❌ dist/index.html or dist/assets missing."
    echo "   Run: git pull origin main"
    exit 1
fi

echo "📁 Copying website build..."
mkdir -p public/website/assets
cp -a dist/assets/. public/website/assets/
cp -a dist/index.html public/website/index.html
echo "✅ Website build copied"

# The dashboard is a separate build. Deploy it only when present.
if [ -d "dist/dashboard/assets" ]; then
    echo "📁 Copying dashboard build..."
    mkdir -p public/website/dashboard/assets
    cp -a dist/dashboard/assets/. public/website/dashboard/assets/
    [ -f "dist/dashboard/index.html" ] && cp -a dist/dashboard/index.html public/website/dashboard/index.html
    echo "✅ Dashboard build copied"
fi

echo "🔄 Clearing Laravel cache..."
php artisan cache:clear

# Verify the exact bundle referenced by index.html landed in the web root.
BUNDLE="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)"
if [ -n "$BUNDLE" ] && [ -f "public/website/$BUNDLE" ]; then
    echo ""
    echo "🎉 =============================================="
    echo "🎉   DEPLOYMENT SUCCESSFUL!"
    echo "🎉   Live bundle: $BUNDLE"
    echo "🎉 =============================================="
    echo ""
    echo "Visit: https://helix.co.tz"
    echo "API docs: https://helix.co.tz/api"
else
    echo "❌ Deployment verification failed (bundle: ${BUNDLE:-not found})"
    ls -lh public/website/assets/index-* 2>/dev/null || true
    exit 1
fi
