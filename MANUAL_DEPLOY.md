# Manual Deployment Instructions

**Date**: November 4, 2026  
**Status**: Ready to Deploy  
**Time Required**: 5-10 minutes

---

## 🚀 Step-by-Step Manual Deployment

### SSH Into Your Server

```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218
```

---

### Step 1: Navigate to Project Directory

```bash
cd /home/sikacgkz/helix.co.tz
pwd
```

**Expected Output**:
```
/home/sikacgkz/helix.co.tz
```

---

### Step 2: Pull Latest Code

```bash
git pull origin main
```

**Expected Output**:
```
From https://github.com/DICKSON78/phermex
   03db38f..2280d90  main -> main
Updating 03db38f..2280d90
Fast-forward
 DEPLOY_NOW.sh | 83 ++++++++++
 1 file changed, 83 insertions(+)
```

---

### Step 3: Run Database Migration

```bash
php artisan migrate --force
```

**Expected Output**:
```
INFO  Running migrations.

  2026_11_04_000004_restructure_pricing_monthly_options .. DONE

INFO  Batch 1 completed successfully.
```

---

### Step 4: Clear Application Cache

```bash
php artisan cache:clear
```

**Expected Output**:
```
Application cache cleared successfully.
```

```bash
php artisan config:cache
```

**Expected Output**:
```
Configuration cache cleared successfully.
Configuration cached successfully.
```

---

### Step 5: Verify Deployment

```bash
php artisan tinker
```

Inside tinker, run:

```php
# Check plan count
SubscriptionPlan::count()
# Expected: 3

# Check plan details
SubscriptionPlan::all()->map(function($p) { 
    return [
        'name' => $p->name, 
        'price' => $p->price,
        'monthly' => round($p->price / 12, 2),
        'period' => $p->billing_period
    ];
})

# Exit tinker
exit
```

**Expected Output**:
```
=> Collection {
     #items: array:3 [
       0 => array:4 [
         "name" => "STARTER"
         "price" => "150.00"
         "monthly" => 12.50
         "period" => "annual"
       ]
       1 => array:4 [
         "name" => "PROFESSIONAL"
         "price" => "200.00"
         "monthly" => 16.67
         "period" => "annual"
       ]
       2 => array:4 [
         "name" => "ENTERPRISE"
         "price" => "250.00"
         "monthly" => 20.83
         "period" => "annual"
       ]
     ]
   }
```

---

## ✅ Verify API Response

From your server or local machine:

```bash
curl -s https://helix.co.tz/api/subscriptions/plans | jq '.data[] | {name, price, price_monthly}'
```

**Expected Output**:
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

---

## 📊 What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Database Plans | 3 annual | 3 annual (marked with billing_period) |
| User Display | $150/year | $12.50/month (Billed $150/year) |
| API Field | No price_monthly | Returns price_monthly |
| Calculation | Not available | 150/12 = 12.50 |

---

## 🔍 Verify Each Step

### Check Git Status

```bash
git log --oneline | head -5
```

Should show:
```
2280d90 Add deployment script
03db38f Add quick deployment guide
43fb677 Add production deployment instructions
a761a59 Simplify to 3 plans: Display annual prices as monthly
...
```

### Check Migration Status

```bash
php artisan migrate:status
```

Should show:
```
  2026_11_04_000004_restructure_pricing_monthly_options | 2026-11-04 00:00:00 | Yes
```

### Check Database Directly

```bash
mysql -u root -p"dasmtai" sikacgkz_pharmex -e "SELECT id, name, price, billing_period FROM subscription_plans;"
```

Expected:
```
id | name           | price | billing_period
1  | STARTER        | 150   | annual
2  | PROFESSIONAL   | 200   | annual
3  | ENTERPRISE     | 250   | annual
```

---

## 🎉 Success Indicators

After deployment, verify:

✅ 3 plans in database  
✅ All have billing_period = 'annual'  
✅ API returns price_monthly field  
✅ No errors in logs  
✅ Calculations correct (150/12 = 12.50)  

---

## 🚨 Troubleshooting

### Issue: Git pull fails

**Solution**:
```bash
git status
git reset --hard
git pull origin main
```

### Issue: Migration fails

**Solution**:
```bash
# Check migration status
php artisan migrate:status

# Rollback
php artisan migrate:rollback --step=1

# Re-run
php artisan migrate --force
```

### Issue: Cache issues

**Solution**:
```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

### Issue: Plans not showing

**Solution**:
```bash
# Restart PHP-FPM
sudo systemctl restart php-fpm

# Or check logs
tail -f storage/logs/laravel.log
```

---

## 📋 Complete Deployment Checklist

- [ ] SSH into server
- [ ] Navigate to /home/sikacgkz/helix.co.tz
- [ ] Run: git pull origin main
- [ ] Run: php artisan migrate --force
- [ ] Run: php artisan cache:clear
- [ ] Run: php artisan config:cache
- [ ] Verify: php artisan tinker (SubscriptionPlan::count() = 3)
- [ ] Test API: curl /api/subscriptions/plans
- [ ] Check logs: tail -f storage/logs/laravel.log

---

## 🎯 Deployment Complete!

When all steps are done:

✅ **Code**: Deployed from GitHub  
✅ **Database**: Migrated successfully  
✅ **Cache**: Cleared  
✅ **Verified**: 3 plans with correct pricing  

Users can now see monthly pricing:
- STARTER: $12.50/month
- PROFESSIONAL: $16.67/month
- ENTERPRISE: $20.83/month

---

## 📞 Need Help?

Check error logs:
```bash
tail -f storage/logs/laravel.log
```

Rollback if needed:
```bash
php artisan migrate:rollback --step=1
```

---

**Git Commit**: 2280d90  
**Date**: November 4, 2026  
**Status**: Production Ready ✅
