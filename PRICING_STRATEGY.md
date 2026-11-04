# Phermex Pricing Strategy - Annual vs Monthly (Business Model)

**Updated**: November 4, 2026  
**Model**: Incentivize annual commitment with 16% discount

---

## 📊 Final Pricing Structure

### Annual Plans (Recommended - Best Value)

| Plan | Annual Price | Monthly Equivalent | Savings |
|------|--------------|-------------------|---------|
| **STARTER** | **$150/year** | $12.50/month | **16% savings** |
| **PROFESSIONAL** | **$200/year** | $16.67/month | **16% savings** |
| **ENTERPRISE** | **$250/year** | $20.83/month | **16% savings** |

### Monthly Plans (Flexible - Pay as You Go)

| Plan | Monthly Price | Annual Cost | vs Annual Plan |
|------|--------------|-------------|-----------------|
| STARTER Monthly | **$14.99/mo** | $179.88/yr | +$29.88 (20% premium) |
| PROFESSIONAL Monthly | **$19.99/mo** | $239.88/yr | +$39.88 (20% premium) |
| ENTERPRISE Monthly | **$24.99/mo** | $299.88/yr | +$49.88 (20% premium) |

---

## 💡 Business Logic Explained

### Why Annual Plans are Cheaper?

1. **Annual Commitment Incentive**
   - User commits for 12 months
   - Platform gets predictable revenue
   - Reward: 16% discount ($1.50/month savings)

2. **Monthly Premium for Flexibility**
   - No long-term commitment
   - Cancel anytime
   - Cost: Extra $29.88-$49.88/year (20% premium)

### Example: STARTER Plan

**Monthly Path**:
- $14.99 × 12 = **$179.88/year**
- Flexible, cancel anytime
- 3-day grace period

**Annual Path**:
- $150 × 1 = **$150/year**
- Saves **$29.88** (16% discount)
- Better value for committed users

---

## 🎯 Revenue Impact Analysis

### Scenario: 100 New Pharmacies

**If 60% choose ANNUAL, 40% choose MONTHLY**:

Annual Revenue:
- 60 × $150 (Starter annual) = $9,000
- 40 × $14.99 × 12 (Starter monthly) = $7,196
- **Total**: $16,196/year

Average per customer: $161.96/year

---

### Scenario: If all chose ANNUAL (Ideal)
- 100 × $150 = $15,000/year
- Average: $150/year

### Scenario: If all chose MONTHLY (Worst)
- 100 × $14.99 × 12 = $17,988/year
- Average: $179.88/year (higher, but higher churn risk)

**Business insight**: Monthly option brings more revenue but risks churn. Annual brings stable revenue with lower churn.

---

## 📱 UI/UX Display Strategy

### Modal: Select Your Plan

```
╔════════════════════════════════════════════════════════╗
║           Choose Your Subscription Plan                ║
║  ┌─────────────────────────────────────────────────┐  ║
║  │  [ANNUAL] ← RECOMMENDED (Save 16%)  [MONTHLY]  │  ║
║  └─────────────────────────────────────────────────┘  ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  📌 ANNUAL PLANS (Best Value)                         ║
║  ─────────────────────────────────────────────────    ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ STARTER                                          │ ║
║  │ $150 per year                                    │ ║
║  │ = $12.50/month (Save $2.50/mo)                  │ ║
║  │ ✓ 3 Users | 1 Pharmacy | No Wholesale          │ ║
║  │ [Subscribe for 1 Year]                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ PROFESSIONAL                                     │ ║
║  │ $200 per year                                    │ ║
║  │ = $16.67/month (Save $3.33/mo)                  │ ║
║  │ ✓ 5 Users | 2 Pharmacies | Wholesale ✓ API     │ ║
║  │ [Subscribe for 1 Year]                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ENTERPRISE                                       │ ║
║  │ $250 per year                                    │ ║
║  │ = $20.83/month (Save $4.16/mo)                  │ ║
║  │ ✓ 10 Users | 5 Pharmacies | Wholesale ✓ API    │ ║
║  │ [Subscribe for 1 Year]                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  💳 MONTHLY PLANS (Flexible)                          ║
║  ─────────────────────────────────────────────────    ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ STARTER Monthly                                  │ ║
║  │ $14.99 per month                                 │ ║
║  │ = $179.88/year (Cancel anytime)                  │ ║
║  │ ✓ 3 Users | 1 Pharmacy | No Wholesale          │ ║
║  │ [Subscribe Monthly]                             │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ PROFESSIONAL Monthly                             │ ║
║  │ $19.99 per month                                 │ ║
║  │ = $239.88/year (Cancel anytime)                  │ ║
║  │ ✓ 5 Users | 2 Pharmacies | Wholesale ✓ API     │ ║
║  │ [Subscribe Monthly]                             │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ENTERPRISE Monthly                               │ ║
║  │ $24.99 per month                                 │ ║
║  │ = $299.88/year (Cancel anytime)                  │ ║
║  │ ✓ 10 Users | 5 Pharmacies | Wholesale ✓ API    │ ║
║  │ [Subscribe Monthly]                             │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## ✨ Plan Features Comparison

| Feature | STARTER | PROFESSIONAL | ENTERPRISE |
|---------|---------|--------------|-----------|
| Users | 3 | 5 | 10 |
| Pharmacies | 1 | 2 | 5 |
| Wholesale Module | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Dedicated Support | ❌ | ❌ | ✅ |
| Grace Period | 3 days | 3 days | 3 days |
| **Annual Price** | **$150** | **$200** | **$250** |
| **Monthly Price** | **$14.99** | **$19.99** | **$24.99** |

---

## 🔄 Plan Upgrade/Downgrade Logic

### Upgrade (STARTER → PROFESSIONAL)

**If ANNUAL**:
- Remaining months credit applied
- Example: 6 months left on $150 plan
- Pro-rate: $100 credit
- New cost: $200 - $100 = **$100 due now**

**If MONTHLY**:
- Current month: Immediate upgrade
- New rate: $19.99/month
- Pro-rate: Difference charged for current month

### Downgrade (PROFESSIONAL → STARTER)

**If ANNUAL**:
- Credit issued for downgrade
- Example: 6 months left on $200 plan
- Pro-rate: $100 credit
- Balance to account: **$100**

**If MONTHLY**:
- Downgrade effective next month
- No penalty, no credit

---

## 💼 Business Metrics

### Key Metrics to Track

1. **Annual to Monthly Ratio**
   - Target: 60% annual, 40% monthly
   - Higher annual % = more predictable revenue

2. **Customer Lifetime Value (LTV)**
   - Annual: Higher (12-month commitment)
   - Monthly: Lower (can churn anytime)

3. **Churn Rate**
   - Annual: Lower (~2-5% annually)
   - Monthly: Higher (~5-10% monthly)

4. **ARPU (Average Revenue Per User)**
   - Annual: $150-$250
   - Monthly: $180-$300 (if lasts full year)

---

## 🎁 Promotional Ideas

### Seasonal Promotions

1. **Black Friday**: "Save 30% on annual plans"
   - STARTER: $150 → $105
   - PROFESSIONAL: $200 → $140
   - ENTERPRISE: $250 → $175

2. **New Year**: "Start Fresh - Free first month on monthly plans"
   - First month free, then $14.99/month

3. **Q1 Push**: "Annual plans only - Special price"
   - Encourage annual commitment

---

## 📊 Database Schema

```sql
ALTER TABLE subscription_plans ADD COLUMN billing_period VARCHAR(50) DEFAULT 'annual';

-- Plans in database:
-- 1. STARTER (annual, $150)
-- 2. STARTER Monthly (monthly, $14.99)
-- 3. PROFESSIONAL (annual, $200)
-- 4. PROFESSIONAL Monthly (monthly, $19.99)
-- 5. ENTERPRISE (annual, $250)
-- 6. ENTERPRISE Monthly (monthly, $24.99)
```

---

## 🚀 Implementation Checklist

### Migration
- [ ] Add `billing_period` column to subscription_plans
- [ ] Create 3 monthly plans ($14.99, $19.99, $24.99)
- [ ] Update existing annual plans with `billing_period='annual'`

### Backend
- [ ] Update SubscriptionController to handle billing_period
- [ ] Implement pro-rata upgrade/downgrade logic
- [ ] Setup recurring billing for monthly plans
- [ ] Add grace period for monthly (3 days)

### Frontend
- [ ] Create subscription selection modal
- [ ] Add Annual/Monthly tab toggle
- [ ] Show pricing comparison
- [ ] Implement checkout flow for both billing types
- [ ] Add auto-renewal warning before billing

### Payment
- [ ] Setup CRDB recurring billing for monthly
- [ ] Implement payment retry logic
- [ ] Send renewal reminders (7 days, 1 day before)
- [ ] Handle failed payment grace period

### Admin
- [ ] Add plan management interface
- [ ] View active subscriptions by billing_period
- [ ] Track revenue by annual vs monthly
- [ ] Churn analysis dashboard

---

## 🎯 Marketing Messages

### For Annual Plans
> "Commit to your success. Get a full year of Phermex for one price, save 16% compared to monthly, and manage your business with confidence."

### For Monthly Plans
> "Flexible commitment. Try us month-to-month with no long-term obligations. Upgrade or downgrade anytime as your business grows."

### For STARTER Monthly ($14.99)
> "Get started today. $14.99/month - Affordable entry with full trial support. Upgrade anytime."

---

## 📈 Expected Outcomes

After implementing this pricing model:

1. **Increased Revenue** (+15-20%)
   - More monthly plans sold
   - Annual premiums (16% discount incentive)

2. **Better Customer Mix**
   - ~60% annual (predictable, low churn)
   - ~40% monthly (higher revenue, more churn)

3. **Flexibility Appeal**
   - Monthly attracts cautious/new customers
   - Annual attracts committed businesses

4. **Improved Retention**
   - Annual commitment = lower churn
   - Monthly upsell to annual through discounts

---

**Status**: Ready for implementation ✅

All pricing points are set, features allocated, and business logic defined. Proceed with frontend implementation.
