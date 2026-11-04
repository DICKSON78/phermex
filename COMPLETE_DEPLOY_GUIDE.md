# Complete Deployment Guide - Pricing Display Fix

**Date**: November 4, 2026  
**Status**: Ready for Production  
**Git Commit**: 65b0440

---

## 🎯 What This Fixes

Users now see **monthly pricing** with annual billing note:
- **STARTER**: $12.50/month (Billed $150/year)
- **PROFESSIONAL**: $16.67/month (Billed $200/year)
- **ENTERPRISE**: $20.83/month (Billed $250/year)

Instead of hardcoded annual prices.

---

## 📋 Backend Deployment

### Step 1: Pull Latest Code

```bash
cd /home/sikacgkz/helix.co.tz
git pull origin main
```

**Expected Output**:
```
From https://github.com/DICKSON78/phermex
   3b80c11..65b0440  main -> main
Fast-forward
 dashboard/src/pages/auth/SubscriptionPlansPage.jsx | XXX ++++
 dashboard/src/i18n/en.js                           | XXX ++++
 dashboard/src/i18n/sw.js                           | XXX ++++
 ...
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build Frontend

```bash
npm run build
```

This compiles the React components with the pricing fixes.

### Step 4: Clear PHP Cache

```bash
php artisan cache:clear
php artisan config:cache
```

---

## ✅ Verification

### 1. Check API Returns price_monthly

```bash
curl -s https://helix.co.tz/api/subscriptions/plans | jq '.data[] | {name, price, price_monthly}'
```

**Expected**:
```json
{
  "name": "STARTER",
  "price": 150,
  "price_monthly": 12.5
}
{
  "name": "PROFESSIONAL",
  "price": 200,
  "price_monthly": 16.67
}
{
  "name": "ENTERPRISE",
  "price": 250,
  "price_monthly": 20.83
}
```

### 2. Visit Login Page

```
https://helix.co.tz/login
```

Click on pricing section and verify:
- ✅ STARTER shows $12.50/month
- ✅ PROFESSIONAL shows $16.67/month
- ✅ ENTERPRISE shows $20.83/month
- ✅ Each has "(Billed $XXX/year)" note

### 3. Check Comparison Table

On the pricing page, click "Compare Features" and verify:
- ✅ Table headers show monthly prices
- ✅ Column headers display plan names with monthly amounts

---

## 🚀 Quick Deploy Script

If you want to run all at once on your server:

```bash
#!/bin/bash
cd /home/sikacgkz/helix.co.tz
echo "Pulling code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Clearing cache..."
php artisan cache:clear
php artisan config:cache

echo "✅ Deployment complete!"
echo ""
echo "Visit https://helix.co.tz/login to verify pricing display"
```

Save as `~/deploy-pricing.sh`, then:
```bash
chmod +x ~/deploy-pricing.sh
./~/deploy-pricing.sh
```

---

## 📊 What Changed

### Frontend (React)
- `dashboard/src/pages/auth/SubscriptionPlansPage.jsx`:
  - Now uses `plan.price_monthly` from API instead of hardcoded COLUMNS
  - Displays as: "$12.50 / month" with "(Billed $150/year)" note
  - Comparison table also updated to show monthly prices

### Translations
- `dashboard/src/i18n/en.js`: Added `billed: 'Billed'`, `year: 'year'`
- `dashboard/src/i18n/sw.js`: Added `billed: 'Imekopiwa'`, `year: 'mwaka'`

### Backend API
- Still returns annual `price` (e.g., 150)
- Also returns calculated `price_monthly` (e.g., 12.5)
- Also returns `display_as_monthly: true` flag

---

## 🔍 Troubleshooting

### Issue: Still seeing old pricing

**Solution**:
```bash
# Clear browser cache
# OR clear application cache
php artisan cache:clear
php artisan view:clear

# Rebuild frontend
npm run build

# Restart web server
sudo systemctl restart php-fpm
```

### Issue: npm install fails

**Solution**:
```bash
npm cache clean --force
npm install
```

### Issue: Frontend not updating

**Solution**:
```bash
# Make sure build was successful
npm run build

# Check browser developer tools (F12)
# Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Clear browser cache completely
# Then visit https://helix.co.tz/login
```

---

## 📚 Related Files

- `app/Http/Controllers/Api/SubscriptionController.php` - API returns price_monthly
- `dashboard/src/pages/auth/SubscriptionPlansPage.jsx` - Frontend pricing display
- `database/migrations/2026_11_04_000004_*.php` - Database billing_period column

---

## ⏱️ Deployment Time

- Git pull: 1 min
- npm install: 2-3 min
- npm run build: 2-3 min
- Cache clear: 1 min
- **Total: ~5-10 minutes**

---

## ✅ Rollback (If Needed)

```bash
git revert 65b0440
git push origin main
npm run build
php artisan cache:clear
```

---

## 📞 Support

If deployment fails:

1. Check error messages in `/storage/logs/laravel.log`
2. Verify `npm run build` completes without errors
3. Ensure PHP cache is cleared
4. Try hard refresh in browser (Ctrl+Shift+R)

---

**Git Commit**: 65b0440  
**Status**: Production Ready ✅  
**Deployment Window**: Low risk, no database changes
