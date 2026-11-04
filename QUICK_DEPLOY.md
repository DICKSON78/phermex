# Quick Deployment Guide

**Date**: November 4, 2026  
**Status**: Ready to Deploy

---

## 🚀 Option 1: Manual Commands (SSH)

Run these commands on your server:

```bash
cd /home/sikacgkz/helix.co.tz

# Pull latest code
git pull origin main

# Run migration
php artisan migrate --force

# Clear cache
php artisan cache:clear
php artisan config:cache

# Verify
php artisan tinker
# Type: SubscriptionPlan::count()
# Should show: 3
# Type: exit
```

---

## 🚀 Option 2: Using Deployment Script

**On Your Server**:

```bash
# Copy deployment script
curl -o /tmp/deploy_phermex.sh https://raw.githubusercontent.com/DICKSON78/phermex/main/deploy_phermex.sh

# Make executable
chmod +x /tmp/deploy_phermex.sh

# Run deployment
/tmp/deploy_phermex.sh
```

**The script will**:
1. ✅ Pull latest code
2. ✅ Run migrations
3. ✅ Clear cache
4. ✅ Verify deployment
5. ✅ Show verification results

---

## ✅ Verify Deployment

After deployment, run:

```bash
# Check plans count
php artisan tinker
SubscriptionPlan::count()  # Should = 3

# Test API
curl -s https://helix.co.tz/api/subscriptions/plans | jq '.data[] | {name, price, price_monthly}'

# Check logs
tail -f storage/logs/laravel.log
```

---

## 🎯 Expected Results

After deployment:

**Database**:
- 3 plans: STARTER, PROFESSIONAL, ENTERPRISE
- All have billing_period = 'annual'

**API Response**:
```json
{
  "name": "STARTER",
  "price": 150,
  "price_monthly": 12.50
}
```

**Users See**:
- STARTER: $12.50/month (Billed $150/year)
- PROFESSIONAL: $16.67/month (Billed $200/year)
- ENTERPRISE: $20.83/month (Billed $250/year)

---

## 🚨 Rollback (If Needed)

```bash
php artisan migrate:rollback --step=1
php artisan cache:clear
```

---

## 📊 Git Info

- **Commit**: 43fb677
- **Branch**: main
- **Files Changed**: 4
- **Status**: Production Ready ✅

---

**Ready to deploy!**
