# 🚀 Helix API Page - Deployment Guide

## Overview
This guide shows how to deploy the new API Documentation page to your production server.

## What's Included
✅ API Documentation page (professional dark theme)
✅ Navigation link added between FAQ and CONTACT
✅ Multilingual support (English & Swahili)
✅ Complete frontend build

## Deployment Steps (On Your Server)

### Step 1: SSH to Server
```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218
```

### Step 2: Navigate to Project
```bash
cd /home/sikacgkz/helix.co.tz
```

### Step 3: Pull Latest Code
```bash
git pull origin main
```

This will download:
- ✅ API page source code
- ✅ Updated routes and navigation
- ✅ Translations (English & Swahili)
- ✅ Built dist/ folder with all assets
- ✅ Deployment script

### Step 4: Run Deployment Script
```bash
bash deploy.sh
```

This script will:
1. ✅ Copy assets to public/website/assets/
2. ✅ Copy dashboard files
3. ✅ Copy index.html
4. ✅ Clear Laravel cache
5. ✅ Verify deployment

### Step 5: Verify Deployment
```bash
curl -s https://helix.co.tz/ | grep -o "HELIX"
```

Expected output: `HELIX`

If you see this → ✅ **Deployment Successful!**

## Test the API Page

### In Browser:
1. Visit: https://helix.co.tz
2. Look for "API" link in navigation (between FAQ and CONTACT)
3. Click it → https://helix.co.tz/api
4. You should see the API documentation page with dark theme

### Features to Test:
- ✅ "API" link appears in navigation menu
- ✅ Sticky header with "Helix API" title
- ✅ Status badge: 🟢 Live & Ready
- ✅ Navigation tabs work (Overview, Subscriptions, e-Prescriptions, Wholesale, Auth)
- ✅ Copy cURL buttons work
- ✅ Links to documentation work
- ✅ Works on mobile (hamburger menu)
- ✅ Language switcher works

## Quick One-Liner Deployment

After SSH, run this single command:

```bash
cd /home/sikacgkz/helix.co.tz && git pull origin main && bash deploy.sh
```

Done! 🎉

## Troubleshooting

### Issue: Deploy script not found
```bash
git pull origin main
ls -l deploy.sh
```

### Issue: Assets not copying
```bash
ls -l dist/assets/
ls -l public/website/assets/
```

### Issue: Old build still showing
```bash
php artisan cache:clear
# Hard refresh browser: Ctrl+Shift+R
```

### Issue: Translations showing as "site.nav.api"
- Means old build is cached
- Run: `php artisan cache:clear`
- Hard refresh browser
- Check that `public/website/assets/index-B5GqlR6W.js` exists (new build)

## File Structure

```
public/website/
├── assets/
│   ├── index-B5GqlR6W.js      ← NEW BUILD (with API page)
│   ├── index-Ct5QChyx.css     ← NEW STYLES
│   └── ...other assets
├── dashboard/
│   └── assets/
│       └── ...dashboard files
└── index.html
```

## Git Commits

Latest commits:
- `f1e6727` - Add deployment script for API page
- `369a4bd` - Add API documentation page to website navigation

## Support

If you encounter issues:
1. Check GitHub for latest commits
2. Run: `git pull origin main` again
3. Run: `bash deploy.sh` again
4. Check file permissions: `ls -l public/website/assets/`

## API Endpoints

Once deployed, these endpoints are available:

### Subscriptions
- GET `/api/subscriptions/plans` - Get subscription plans

### e-Prescriptions (requires API key)
- POST `/api/eprescriptions/submit`
- GET `/api/eprescriptions/{id}`
- POST `/api/eprescriptions/{id}/fulfill`
- GET `/api/eprescriptions/{id}/delivery-status`

### Wholesale (requires API key)
- GET `/api/wholesale/list`
- POST `/api/wholesale/register`
- And 13+ more wholesale endpoints

Full documentation: https://helix.co.tz/api

---

**Version**: 1.0
**Last Updated**: Nov 5, 2026
**Status**: Ready for Production ✅
