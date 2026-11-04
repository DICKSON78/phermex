# Deploy Pre-Built Assets (No Server Build Needed)

**Date**: November 4, 2026  
**Build Status**: ✅ Complete  
**Build Size**: 20M (16M compressed)  
**Files**: 46 compiled files  

---

## 📦 What You Have

Local build is already compiled and ready:
- ✅ `dist/` directory with all compiled assets
- ✅ Pricing display fix included
- ✅ All translations compiled
- ✅ Dashboard app compiled
- ✅ Ready to deploy to server

---

## 🚀 Deployment Options

### Option 1: Manual SCP (Simple & Reliable)

**Step 1: Copy build to server**

```bash
scp -r -P 21098 -i ~/das123 \
  /home/dickson/Documents/Work/Phermex/phermex-website/dist/* \
  sikacgkz@184.94.213.218:/home/sikacgkz/helix.co.tz/public/
```

**Step 2: SSH to server and clear cache**

```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218
cd /home/sikacgkz/helix.co.tz
php artisan cache:clear
php artisan config:cache
exit
```

**Step 3: Verify**

Visit: https://helix.co.tz/login

---

### Option 2: Automated Script

Create file `~/deploy-prebuilt.sh`:

```bash
#!/bin/bash

LOCAL_BUILD="/home/dickson/Documents/Work/Phermex/phermex-website/dist"
SERVER="sikacgkz@184.94.213.218"
REMOTE_PATH="/home/sikacgkz/helix.co.tz/public"
SSH_PORT="21098"
SSH_KEY="$HOME/das123"

echo "🚀 Deploying pre-built assets..."
echo "From: $LOCAL_BUILD"
echo "To: $SERVER:$REMOTE_PATH"
echo ""

# Copy files
scp -r -P $SSH_PORT -i $SSH_KEY $LOCAL_BUILD/* $SERVER:$REMOTE_PATH/

if [ $? -eq 0 ]; then
    echo "✅ Files deployed"
    echo ""
    echo "🔄 Clearing cache on server..."
    
    # Clear cache remotely
    ssh -p $SSH_PORT -i $SSH_KEY $SERVER \
        "cd /home/sikacgkz/helix.co.tz && php artisan cache:clear && php artisan config:cache"
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Visit: https://helix.co.tz/login"
else
    echo "❌ Deployment failed"
    exit 1
fi
```

Run it:
```bash
chmod +x ~/deploy-prebuilt.sh
~/deploy-prebuilt.sh
```

---

### Option 3: Using rsync (Fastest for multiple deployments)

```bash
rsync -avz -e "ssh -p 21098 -i ~/das123" \
  /home/dickson/Documents/Work/Phermex/phermex-website/dist/ \
  sikacgkz@184.94.213.218:/home/sikacgkz/helix.co.tz/public/
```

Then clear cache:
```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218 \
  "cd /home/sikacgkz/helix.co.tz && php artisan cache:clear"
```

---

## 📋 Step-by-Step Guide

### Step 1: Verify Local Build

```bash
cd /home/dickson/Documents/Work/Phermex/phermex-website
ls -lh dist/
# Should show: dist/ directory with assets
```

### Step 2: Deploy to Server

Choose one of the options above. For example, using SCP:

```bash
scp -r -P 21098 -i ~/das123 \
  /home/dickson/Documents/Work/Phermex/phermex-website/dist/* \
  sikacgkz@184.94.213.218:/home/sikacgkz/helix.co.tz/public/
```

Watch for:
- ✅ Files copying...
- ✅ No permission errors
- ✅ Completes successfully

### Step 3: Clear Server Cache

```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218
```

Then on server:
```bash
cd /home/sikacgkz/helix.co.tz
php artisan cache:clear
php artisan config:cache
exit
```

### Step 4: Verify Deployment

Open browser:
```
https://helix.co.tz/login
```

Check pricing page:
- ✅ STARTER shows $12.50/month
- ✅ Billing note shows (Billed $150/year)
- ✅ All 3 plans visible
- ✅ No errors in browser console (F12)

---

## 📊 What Gets Deployed

**Website Assets** (dist/):
```
dist/
├── dashboard/                    # Dashboard app
│   ├── index.html
│   └── assets/
│       ├── index-QUQulm4-.js    # Main app bundle
│       └── index-DZbDSxPC.css   # Styles
├── assets/
│   ├── index-BO03xgsU.js        # Website JS
│   └── index-BdkpaQ8A.css       # Website CSS
├── index.html                    # Website home
└── (icons, logos, etc.)
```

**What's Included**:
- ✅ SubscriptionPlansPage with monthly pricing
- ✅ Translations (EN & SW)
- ✅ Comparison table
- ✅ Billing note display
- ✅ All UI components

**What's NOT Included** (handled separately):
- ❌ Database (already on server)
- ❌ PHP code (pull from git)
- ❌ Configuration (already on server)

---

## ✅ Verification Commands

After deployment, run on server:

**Check API returns price_monthly:**
```bash
curl -s https://helix.co.tz/api/subscriptions/plans | jq '.data[0]'
```

Expected:
```json
{
  "name": "STARTER",
  "price": 150,
  "price_monthly": 12.5
}
```

**Check files deployed:**
```bash
ls -lh /home/sikacgkz/helix.co.tz/public/dashboard/assets/
```

**View logs:**
```bash
tail -f /home/sikacgkz/helix.co.tz/storage/logs/laravel.log
```

---

## 🔍 Troubleshooting

### Issue: SCP hangs or times out

**Solution**: The SSH key has a passphrase. You may need to use:
```bash
ssh-agent bash
ssh-add ~/das123  # Enter passphrase once
scp -r -P 21098 ... # Now works without passphrase
```

### Issue: Files deploy but old pricing still shows

**Solution**: Clear cache on server:
```bash
ssh -p 21098 -i ~/das123 sikacgkz@184.94.213.218 \
  "cd /home/sikacgkz/helix.co.tz && php artisan cache:clear"
```

Then hard-refresh browser: `Ctrl+Shift+R`

### Issue: Errors in browser console

**Solution**: 
1. Clear browser cache completely
2. Open incognito/private window
3. Check server logs: `tail -f storage/logs/laravel.log`

---

## ⏱️ Deployment Time

- SCP transfer: 1-2 minutes
- Cache clear: 30 seconds
- Total: ~2-3 minutes

---

## 🔄 Rollback (If Needed)

If something goes wrong after deployment:

**Option 1: Redeploy previous build** (if you have it)
```bash
git checkout HEAD~1 -- dist/
npm run build
scp -r dist/* server:/path/
```

**Option 2: Pull from git and rebuild on server**
```bash
ssh server
cd /home/sikacgkz/helix.co.tz
git checkout main -- dashboard/src/pages/auth/SubscriptionPlansPage.jsx
npm run build
php artisan cache:clear
```

---

## 📝 Notes

- **No npm install on server needed** (already has node_modules)
- **No build on server needed** (build already done locally)
- **Just copy files and clear cache**
- **Fast deployment, minimal server load**

---

## 🎯 Success Checklist

After deployment:
- [ ] Files copied to server
- [ ] Cache cleared on server
- [ ] Website loads without errors
- [ ] Pricing page shows monthly prices
- [ ] Billing note displays
- [ ] Comparison table works
- [ ] Mobile view responsive
- [ ] No console errors

---

**Status**: ✅ Ready for deployment  
**Build Date**: November 4, 2026  
**Build Version**: 310a185  
