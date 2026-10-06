#!/usr/bin/env bash
# Runs the subscription payment end-to-end check against a throwaway database.
#
# The gateway preview and status calls reach ClickPesa for real; only the
# USSD-PUSH initiate call is faked inside the script, so no prompt is ever sent
# to a real phone number.
#
# Usage: bash tests/Feature/run_subscription_payment_e2e.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB="/tmp/pharmex_e2e.sqlite"

cd "$ROOT"

cp database/testing.sqlite "$DB"

# testing.sqlite predates the migration that added the starter and professional
# tiers, so its CHECK constraint still rejects them. Rebuild just that table with
# the constraint the migration establishes. MySQL is not involved here.
sqlite3 "$DB" <<'SQL'
PRAGMA foreign_keys=off;
CREATE TABLE subscriptions_new (
  id integer primary key autoincrement not null,
  pharmacy_id integer not null,
  plan varchar not null default 'trial',
  amount numeric not null,
  payment_method varchar,
  transaction_id varchar,
  status varchar not null default 'active',
  start_date date not null,
  end_date date not null,
  created_at datetime,
  updated_at datetime
);
INSERT INTO subscriptions_new
  SELECT id, pharmacy_id, plan, amount, payment_method, transaction_id,
         status, start_date, end_date, created_at, updated_at
  FROM subscriptions;
DROP TABLE subscriptions;
ALTER TABLE subscriptions_new RENAME TO subscriptions;
PRAGMA foreign_keys=on;
SQL

DB_CONNECTION=sqlite DB_DATABASE="$DB" CACHE_STORE=array \
  php artisan db:seed --class=SubscriptionPlanSeeder --force >/dev/null

echo "database ready: $(sqlite3 "$DB" 'SELECT count(*) FROM subscription_plans;') plans"

DB_CONNECTION=sqlite DB_DATABASE="$DB" CACHE_STORE=array \
  php tests/Feature/subscription_payment_e2e.php
