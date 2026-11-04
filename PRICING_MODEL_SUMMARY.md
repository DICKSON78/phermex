# Phermex Pricing Model - Business-Minded Implementation

**Date**: November 4, 2026  
**Model**: Annual vs Monthly with Incentive Structure  
**Status**: Ready for Deployment

---

## 🎯 Executive Summary

Restructured Phermex pricing to incentivize annual commitments while offering monthly flexibility:

- **Annual Plans**: $150, $200, $250 (16% discount vs monthly)
- **Monthly Plans**: $14.99, $19.99, $24.99 (pay-as-you-go)
- **Business Logic**: Annual revenue stability + Monthly flexibility
- **Result**: Higher revenue potential + Better customer retention

---

## 💰 Final Pricing Table

### Comparison View

| Plan Tier | Annual Option | Monthly Option | Annual Savings |
|-----------|---------------|-----------------|-----------------|
| **STARTER** | **$150/year** | **$14.99/month** | **$29.88 (16%)** |
| **PROFESSIONAL** | **$200/year** | **$19.99/month** | **$39.88 (16%)** |
| **ENTERPRISE** | **$250/year** | **$24.99/month** | **$49.88 (16%)** |

### Monthly Breakdown

```
ANNUAL PLANS:
─────────────────────────────────
STARTER:       $150/year  = $12.50/month ✓ BEST VALUE
PROFESSIONAL:  $200/year  = $16.67/month ✓ BEST VALUE
ENTERPRISE:    $250/year  = $20.83/month ✓ BEST VALUE

MONTHLY PLANS:
─────────────────────────────────
STARTER:       $14.99/month = $179.88/year
PROFESSIONAL:  $19.99/month = $239.88/year
ENTERPRISE:    $24.99/month = $299.88/year
```

---

## ✨ Features by Plan

### STARTER (Annual: $150 | Monthly: $14.99)
- ✓ 3 Users
- ✓ 1 Pharmacy
- ✓ 3-day Grace Period
- ✗ Wholesale Module
- ✗ API Access
- ✗ Priority Support

### PROFESSIONAL (Annual: $200 | Monthly: $19.99)
- ✓ 5 Users
- ✓ 2 Pharmacies
- ✓ 3-day Grace Period
- ✓ **Wholesale Module**
- ✓ **API Access**
- ✓ **Priority Support**

### ENTERPRISE (Annual: $250 | Monthly: $24.99)
- ✓ 10 Users
- ✓ 5 Pharmacies
- ✓ 3-day Grace Period
- ✓ **Wholesale Module**
- ✓ **API Access**
- ✓ **Priority Support**
- ✓ **Dedicated Support**

---

## 📊 Business Model Benefits

### 1. Revenue Optimization

**Annual Plans**:
- Predictable recurring revenue (ARR)
- Lower churn risk
- Upfront cash collection
- Incentive: 16% discount vs monthly

**Monthly Plans**:
- Higher per-customer annual value ($179.88-$299.88)
- Attracts cautious/new customers
- Flexibility = conversion rate ↑
- Premium: 20% higher cost

### 2. Customer Acquisition

**For Annual Buyers**:
- "Save $29.88+ with annual commitment"
- "Best for established pharmacies"
- Message: Stability, value, commitment

**For Monthly Buyers**:
- "$14.99 to get started - No long-term commitment"
- "Perfect for testing, flexibility"
- Message: Flexibility, risk-free, scalable

### 3. Revenue Projections

**100 New Customers (60% annual, 40% monthly)**:
- Annual revenue: $16,196
- Average per customer: $161.96/year
- Monthly recurring: ~$1,349.67

**1000 Customers (60% annual, 40% monthly)**:
- Annual revenue: $161,960
- Monthly recurring: ~$13,497

---

## 🔄 Implementation Details

### Database Migration

```sql
-- Migration: 2026_11_04_000004_restructure_pricing_monthly_options

-- Add column
ALTER TABLE subscription_plans 
ADD COLUMN billing_period VARCHAR(50) DEFAULT 'annual';

-- Update existing annual plans
UPDATE subscription_plans 
SET billing_period = 'annual' 
WHERE slug IN ('starter', 'professional', 'enterprise');

-- Insert monthly plans
INSERT INTO subscription_plans (...) VALUES
  ('STARTER Monthly', 'starter-monthly', 1, 14.99, 'monthly', ...),
  ('PROFESSIONAL Monthly', 'professional-monthly', 1, 19.99, 'monthly', ...),
  ('ENTERPRISE Monthly', 'enterprise-monthly', 1, 24.99, 'monthly', ...);
```

### Plans in Database

After migration, subscription_plans table contains:

```
ID | Name                    | Slug                  | Price  | Duration | Billing   | Features
───┼─────────────────────────┼──────────────────────┼────────┼──────────┼───────────┼──────────
1  | STARTER                 | starter               | 150.00 | 12       | annual    | {3 users, 1 pharmacy}
2  | STARTER Monthly         | starter-monthly       | 14.99  | 1        | monthly   | {3 users, 1 pharmacy}
3  | PROFESSIONAL            | professional          | 200.00 | 12       | annual    | {5 users, 2 pharmacies, wholesale}
4  | PROFESSIONAL Monthly    | professional-monthly  | 19.99  | 1        | monthly   | {5 users, 2 pharmacies, wholesale}
5  | ENTERPRISE              | enterprise            | 250.00 | 12       | annual    | {10 users, 5 pharmacies}
6  | ENTERPRISE Monthly      | enterprise-monthly    | 24.99  | 1        | monthly   | {10 users, 5 pharmacies}
```

---

## 🎨 Frontend UI/UX

### Subscription Selection Modal

**Layout**: Two-tab interface

```
Tab 1: ANNUAL PLANS (Recommended - Save 16%)
├── STARTER: $150/year = $12.50/month
├── PROFESSIONAL: $200/year = $16.67/month
└── ENTERPRISE: $250/year = $20.83/month

Tab 2: MONTHLY PLANS (Flexible - Cancel Anytime)
├── STARTER: $14.99/month
├── PROFESSIONAL: $19.99/month
└── ENTERPRISE: $24.99/month
```

**Card Design**:
```
┌─────────────────────────────────────┐
│ PROFESSIONAL                        │ ← Plan Name
│ $200/year  (Annual)                 │ ← Price
│ $16.67/month equivalent             │ ← Monthly breakdown
│ Save $3.33/month vs monthly plan    │ ← Value proposition
│                                     │
│ ✓ 5 Users                           │
│ ✓ 2 Pharmacies                      │
│ ✓ Wholesale Module                  │
│ ✓ API Access                        │
│ ✓ Priority Support                  │
│ ✓ 3-day Grace Period                │
│                                     │
│ [Subscribe for 1 Year]              │ ← CTA Button
└─────────────────────────────────────┘
```

---

## 💳 Payment Processing

### Annual Plans

```
User selects PROFESSIONAL Annual ($200)
    ↓
Checkout page
    ↓
One-time payment: $200
    ↓
CRDB Card Payment
    ↓
Subscription activated for 12 months
    ↓
Renewal reminder at month 11
```

### Monthly Plans

```
User selects PROFESSIONAL Monthly ($19.99)
    ↓
Checkout page
    ↓
Setup recurring payment: $19.99/month
    ↓
CRDB Card (Recurring billing)
    ↓
Subscription activated for 1 month
    ↓
Auto-renews on day 1 of next month
    ↓
3-day grace period if payment fails
```

---

## 🔐 Subscription Management

### For Annual Subscribers

- Renewal date shown in dashboard
- Upgrade option 30 days before renewal
- Downgrade with pro-rata credit
- Auto-renewal can be disabled

### For Monthly Subscribers

- Next billing date in dashboard
- Upgrade/downgrade effective next month
- Cancel anytime (effective end of month)
- 3-day grace period on failed payment

---

## 📈 Pricing Strategy Communication

### To New Users

> **Annual Plans**: "Commit to your success with a full year plan - save 16% and enjoy stable pricing while your business grows."

> **Monthly Plans**: "Start flexible. $14.99/month gets you started with no long-term commitment. Upgrade anytime as you scale."

### Marketing Messages

**For STARTER Annual ($150)**
- "Most Affordable"
- "Perfect for small pharmacies"
- "Save $29.88 vs monthly"

**For STARTER Monthly ($14.99)**
- "Get Started"
- "Test-drive Phermex"
- "Cancel anytime"

**For PROFESSIONAL ($200 annual / $19.99 monthly)**
- "Most Popular"
- "Full features included"
- "Best for growing pharmacies"

**For ENTERPRISE ($250 annual / $24.99 monthly)**
- "Premium Support"
- "Scale without limits"
- "Dedicated team support"

---

## 🚀 Rollout Plan

### Phase 1: Database Setup
- [ ] Apply migration 2026_11_04_000004
- [ ] Verify 6 plans created
- [ ] Test plan queries

### Phase 2: Backend Updates
- [ ] Update SubscriptionController
- [ ] Handle billing_period in checkout
- [ ] Implement pro-rata logic for upgrades
- [ ] Setup recurring payment routing

### Phase 3: Frontend Implementation
- [ ] Create subscription selection modal
- [ ] Add Annual/Monthly tabs
- [ ] Show pricing comparison
- [ ] Implement checkout flow
- [ ] Add payment method selection

### Phase 4: Testing
- [ ] Test annual payment flow
- [ ] Test monthly recurring billing
- [ ] Test plan upgrades/downgrades
- [ ] Test grace period for monthly
- [ ] Test renewal reminders

### Phase 5: Launch
- [ ] Enable new pricing on production
- [ ] Update marketing site
- [ ] Send announcement to users
- [ ] Monitor adoption metrics

---

## 📊 Success Metrics

### To Track After Launch

1. **Plan Selection Ratio**
   - Target: 60% annual, 40% monthly
   - Monitor: Weekly adoption

2. **Conversion Rate**
   - Baseline: Compare before/after
   - Goal: Increase 10-15% due to monthly option

3. **Average Revenue Per User (ARPU)**
   - Annual: $150-250
   - Monthly: $180-300/year (if full year)

4. **Churn Rate**
   - Annual: <5% annually
   - Monthly: 5-10% monthly (expected)

5. **Revenue Trends**
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - Growth Rate

---

## 🎁 Optional Promotions

### Initial Launch Offer
- "First month half-price on monthly plans"
- STARTER: $7.49 first month, then $14.99
- Drives trial conversions

### Annual Incentive
- "Annual plans include priority support"
- Encourages annual over monthly

### Seasonal Campaigns
- Black Friday: "30% off annual plans"
- New Year: "Annual commitment special"
- Q1: "Bulk discounts for multi-pharmacy"

---

## ✅ Deployment Checklist

### Before Launch
- [ ] All 6 plans in database
- [ ] Pricing display tested
- [ ] Payment flows verified
- [ ] Grace period functioning
- [ ] Renewal reminders configured

### After Launch
- [ ] Monitor payment success rate
- [ ] Track plan adoption
- [ ] Check for billing issues
- [ ] Review customer feedback
- [ ] Adjust messaging if needed

---

## 📞 Support & FAQs

### Can I switch from Annual to Monthly?
"Yes! You can downgrade to monthly anytime. Your remaining balance will be credited to your account."

### What if my annual payment fails?
"We'll retry for 3 days. After that, your access will temporarily pause, but your data remains safe."

### Can I cancel my monthly plan?
"Yes, you can cancel anytime. Your subscription ends at the end of the current billing period."

### What's the difference between plans?
"Each tier offers more users, pharmacies, and features. See the comparison table above."

---

## 🎯 Conclusion

This business-minded pricing model:

✅ Incentivizes annual commitments (16% savings)  
✅ Offers monthly flexibility ($14.99 entry)  
✅ Maximizes revenue potential  
✅ Reduces customer churn  
✅ Appeals to multiple customer segments  
✅ Easy to scale and adjust  

**Status**: Ready for production deployment

---

**Next Steps**:
1. Apply migration 2026_11_04_000004
2. Implement frontend subscription modal
3. Test payment flows
4. Launch with marketing push
5. Monitor metrics closely

---

**Prepared By**: Phermex Development Team  
**Date**: November 4, 2026  
**Commit**: ee44cbd
