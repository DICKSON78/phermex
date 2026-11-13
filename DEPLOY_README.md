# 🚀 Helix Website Deployment

## How it works

The production server has **no Node/npm**, so the site is built locally and the
build output (`dist/`) is committed to git. Deploying is then just:

1. Build locally (`npm run build`)
2. Commit + push `dist/` together with any source changes
3. On the server: `git pull origin main && bash deploy.sh`

`deploy.sh` copies `dist/` into the web roots (`public/` and `public/website/`),
clears the Laravel cache, and verifies the live bundle.

## Deploy commands

Local:

```bash
npm run build
git add -A
git commit -m "Build website"
git push origin main
```

Server:

```bash
cd /home/sikacgkz/helix.co.tz
git pull origin main
bash deploy.sh
```

Expected server output ends with:

```
🎉   DEPLOYMENT SUCCESSFUL!
🎉   Live bundle: assets/index-<hash>.js
```

## Verify

```bash
# index.html must reference the new bundle
curl -s https://helix.co.tz/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js'

# API docs page
curl -s -o /dev/null -w '%{http_code}\n' https://helix.co.tz/api
```

Then hard-refresh the browser: **Ctrl+Shift+R**.

## Important notes

- `dist/` is committed on purpose — do **not** re-add it to `.gitignore`.
- The repo also contains `public/index.html` (the vhost serves the root page
  from it), so `deploy.sh` updates both `public/` and `public/website/`.
- Never run `npm run build` on the server; it has no npm.
- If the site shows `site.*` translation keys, check that
  `src/main.jsx` wraps `<App />` in `<LanguageProvider>` and that the deployed
  bundle contains the string `helix_lang`.

## Supply-chain demo data

The manufacturer, wholesaler, admin and customer order screens are data-driven.
On a fresh database they render their empty states until supplier accounts and
orders exist. Seed the demo accounts when an environment needs usable flows:

```bash
php artisan db:seed --class=ManufacturerAccountSeeder --force
php artisan db:seed --class=WholesalerAccountSeeder --force
```

Both seeders are idempotent. `WholesalerAccountSeeder` also copies up to five
existing pharmacy drugs into the demo wholesaler catalogue, so the wholesale
marketplace is browsable immediately. Actual orders are still created through
the normal owner → wholesaler and wholesaler → manufacturer flows.

Demo logins (password `password`):

| Role | Email |
| --- | --- |
| Manufacturer | `manufacturer@pharmex.com` |
| Wholesaler | `wholesaler@pharmex.com` |
| Admin | `admin@pharmex.com` |
| Owner | `owner@pharmex.com` |

## API endpoints

### Subscriptions
- `GET /api/subscriptions/plans`

### e-Prescriptions (requires API key)
- `POST /api/eprescriptions/submit`
- `GET /api/eprescriptions/{id}`
- `POST /api/eprescriptions/{id}/fulfill`
- `GET /api/eprescriptions/{id}/delivery-status`

### Wholesale (requires API key)
- `GET /api/wholesale/list`
- `POST /api/wholesale/register`
- …and more

Full docs: https://helix.co.tz/api
