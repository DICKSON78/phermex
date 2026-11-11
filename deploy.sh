#!/bin/bash
#
# Deploy the committed website build to the live web root.
# Run on the server after: git pull origin main
#
# The production server has no Node/npm, so dist/ is built locally, committed
# to git, and copied here. Historically the vhost has served index.html from
# public/ while assets resolve from public/website/, so deploy to both roots.

set -euo pipefail

ROOT="${HELIX_ROOT:-/home/sikacgkz/helix.co.tz}"
cd "$ROOT"

echo "🚀 Starting Helix website deployment..."

if [ ! -f "dist/index.html" ] || [ ! -d "dist/assets" ]; then
    echo "❌ dist/index.html or dist/assets missing."
    echo "   Run: git pull origin main"
    exit 1
fi

# Restore the dashboard SPA if its tracked files were ever removed locally.
# Laravel routes /login, /register and /app to public/dashboard/index.html.
if [ ! -f "public/dashboard/index.html" ]; then
    echo "📦 Restoring dashboard build from git..."
    git checkout -- public/dashboard
    echo "✅ Dashboard restored"
fi

deploy_webroot() {
    local target="$1"
    echo "📁 Copying build into $target ..."
    mkdir -p "$target/assets"
    cp -a dist/assets/. "$target/assets/"
    cp -a dist/index.html "$target/index.html"
    echo "✅ $target updated"
}

# Deploy to both roots so whichever one the vhost prefers is current.
deploy_webroot "public/website"
deploy_webroot "public"

# The dashboard is a separate build. Deploy it from public/dashboard/ (committed to git).
if [ -d "public/dashboard/assets" ]; then
    echo "📁 Copying dashboard build..."
    mkdir -p public/website/dashboard/assets
    cp -a public/dashboard/assets/. public/website/dashboard/assets/
    [ -f "public/dashboard/index.html" ] && cp -a public/dashboard/index.html public/website/dashboard/index.html
    [ -f "public/dashboard/sw.js" ] && cp -a public/dashboard/sw.js public/website/dashboard/sw.js
    echo "✅ Dashboard build copied"
fi

echo "🔄 Clearing Laravel cache..."
php artisan cache:clear

# Verify the exact bundle referenced by index.html landed in the web roots.
BUNDLE="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)"
if [ -n "$BUNDLE" ] && [ -f "public/website/$BUNDLE" ] && [ -f "public/$BUNDLE" ]; then
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
    ls -lh public/website/assets/index-* public/assets/index-* 2>/dev/null || true
    exit 1
fi
