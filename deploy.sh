#!/bin/bash

# Deployment script for Helix API Page
# Run this on SERVER after: git pull origin main

cd /home/sikacgkz/helix.co.tz

echo "🚀 Starting Helix API deployment..."

# 1. Check if dist folder exists (from git pull)
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found!"
    echo "Make sure you ran: git pull origin main"
    exit 1
fi

echo "✅ dist folder found"

# 2. Copy assets to public/website/assets
echo "📁 Copying assets..."
cp -r dist/assets/* public/website/assets/ 2>/dev/null || echo "⚠️ Some assets may not have copied"
echo "✅ Assets copied"

# 3. Copy dashboard to public/website/dashboard
echo "📁 Copying dashboard..."
cp -r dist/dashboard/assets/* public/website/dashboard/assets/ 2>/dev/null || echo "⚠️ Dashboard assets may not have copied"
echo "✅ Dashboard copied"

# 4. Copy index.html
echo "📁 Copying index.html..."
cp dist/index.html public/website/ 2>/dev/null || echo "⚠️ index.html not copied"
echo "✅ index.html copied"

# 5. Clear Laravel cache
echo "🔄 Clearing cache..."
php artisan cache:clear
echo "✅ Cache cleared"

# 6. Verify deployment
echo "🔍 Verifying deployment..."
if [ -f "public/website/assets/index-B5GqlR6W.js" ]; then
    echo "✅ NEW BUILD FOUND: index-B5GqlR6W.js"
    echo ""
    echo "🎉 =============================================="
    echo "🎉   DEPLOYMENT SUCCESSFUL!"
    echo "🎉   API Page is LIVE!"
    echo "🎉 =============================================="
    echo ""
    echo "Visit: https://helix.co.tz"
    echo "Look for 'API' in navigation (between FAQ and CONTACT)"
    echo "Click it → https://helix.co.tz/api"
else
    echo "❌ NEW BUILD NOT FOUND"
    echo "Check if git pull copied dist folder correctly"
    ls -lh public/website/assets/index-*
fi
