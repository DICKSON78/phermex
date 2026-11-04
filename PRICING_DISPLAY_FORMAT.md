# Pricing Display Format - 3 Plans Shown as Monthly

**Updated**: November 4, 2026  
**Model**: 3 Annual Plans + Display as Monthly Equivalent  
**Status**: Ready

---

## 📊 Pricing Structure (Database vs Display)

### Database Storage (Annual)
```
STARTER:       $150/year (stored in DB)
PROFESSIONAL:  $200/year (stored in DB)
ENTERPRISE:    $250/year (stored in DB)
```

### Frontend Display (Monthly Equivalent)
```
STARTER:       $12.50/month (150 ÷ 12)
PROFESSIONAL:  $16.67/month (200 ÷ 12)
ENTERPRISE:    $20.83/month (250 ÷ 12)
```

---

## 💡 Business Logic

### Why Store as Annual, Display as Monthly?

1. **Database**: Keep annual pricing ($150, $200, $250)
   - Cleaner data
   - Standard subscription model
   - Easier calculations

2. **Frontend**: Show monthly equivalent to users
   - Feels more affordable ($12.50 vs $150)
   - Easier for customers to understand
   - Psychological pricing advantage
   - Annual billing happens automatically

3. **Billing**: User pays full year upfront
   - One payment = $150 for STARTER
   - Auto-renews yearly
   - 30-day free trial before payment

---

## 🎨 UI Display Format

### Subscription Selection Modal

```
Choose Your Package

┌────────────────────────────────────┐
│  🏢 STARTER                        │
│                                    │
│  $12.50/month                      │
│  (Billed $150/year)                │
│                                    │
│  ✓ 3 Users                         │
│  ✓ 1 Pharmacy                      │
│  ✓ Basic Support                   │
│  ✓ 3-day Grace Period              │
│                                    │
│  [Subscribe]                       │
│                                    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  💼 PROFESSIONAL                   │
│                                    │
│  $16.67/month                      │
│  (Billed $200/year)                │
│                                    │
│  ✓ 5 Users                         │
│  ✓ 2 Pharmacies                    │
│  ✓ Wholesale Module ✅             │
│  ✓ API Access ✅                   │
│  ✓ Priority Support ✅             │
│  ✓ 3-day Grace Period              │
│                                    │
│  [Subscribe]                       │
│                                    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  🏆 ENTERPRISE                     │
│                                    │
│  $20.83/month                      │
│  (Billed $250/year)                │
│                                    │
│  ✓ 10 Users                        │
│  ✓ 5 Pharmacies                    │
│  ✓ Wholesale Module ✅             │
│  ✓ API Access ✅                   │
│  ✓ Dedicated Support ✅            │
│  ✓ 3-day Grace Period              │
│                                    │
│  [Subscribe]                       │
│                                    │
└────────────────────────────────────┘
```

---

## 🔄 API Response Format

### GET /api/subscriptions/plans

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "STARTER",
      "slug": "starter",
      "price": 150.00,
      "price_monthly": 12.50,
      "display_as_monthly": true,
      "currency": "USD",
      "duration_months": 12,
      "features": {
        "users": 3,
        "pharmacies": 1
      },
      "grace_period_days": 3
    },
    {
      "id": 2,
      "name": "PROFESSIONAL",
      "slug": "professional",
      "price": 200.00,
      "price_monthly": 16.67,
      "display_as_monthly": true,
      "currency": "USD",
      "duration_months": 12,
      "features": {
        "users": 5,
        "pharmacies": 2,
        "wholesale": true
      },
      "grace_period_days": 3
    },
    {
      "id": 3,
      "name": "ENTERPRISE",
      "slug": "enterprise",
      "price": 250.00,
      "price_monthly": 20.83,
      "display_as_monthly": true,
      "currency": "USD",
      "duration_months": 12,
      "features": {
        "users": 10,
        "pharmacies": 5,
        "wholesale": true
      },
      "grace_period_days": 3
    }
  ]
}
```

---

## 💳 Checkout Flow

### User Perspective

1. **Sees**: "$12.50/month" for STARTER
2. **Clicks**: Subscribe button
3. **Checkout**: Shows "$150 annual billing"
4. **Payment**: One-time charge $150
5. **Message**: "You'll be billed $150/year. Renews on [date]"
6. **Renewal**: Auto-renews in 12 months

---

## 📱 Frontend Implementation

### React/Vue Component Example

```javascript
// Display price as monthly equivalent
<div class="price">
  <span class="amount">${{plan.price_monthly}}</span>
  <span class="period">/month</span>
  <small>(Billed ${plan.price}/year)</small>
</div>

// Calculations
const monthlyPrice = (annualPrice) => (annualPrice / 12).toFixed(2);
const displayPrice = plan.price_monthly; // From API
const annualPrice = plan.price;
```

---

## ✨ Features by Plan

### STARTER ($150/yr = $12.50/mo)
- 3 Users
- 1 Pharmacy
- Basic Support
- 3-day Grace Period
- 30-day Trial

### PROFESSIONAL ($200/yr = $16.67/mo)
- 5 Users
- 2 Pharmacies
- **Wholesale Module** ✅
- **API Access** ✅
- **Priority Support** ✅
- 3-day Grace Period
- 30-day Trial

### ENTERPRISE ($250/yr = $20.83/mo)
- 10 Users
- 5 Pharmacies
- **Wholesale Module** ✅
- **API Access** ✅
- **Dedicated Support** ✅
- 3-day Grace Period
- 30-day Trial

---

## 🎯 Key Points

1. **Database**: Store annual prices ($150, $200, $250)
2. **Display**: Show monthly equivalent ($12.50, $16.67, $20.83)
3. **Billing**: Charge full annual amount upfront
4. **Auto-renewal**: Yearly on anniversary date
5. **Trial**: 30 days free before payment

---

## 📊 Example Calculations

### STARTER Pricing
```
Annual Price (DB):    $150.00
Monthly Display:      $150 ÷ 12 = $12.50
User sees:            "$12.50/month (Billed $150/year)"
Payment:              One-time $150 charge
Renewal:              Every 12 months
```

### PROFESSIONAL Pricing
```
Annual Price (DB):    $200.00
Monthly Display:      $200 ÷ 12 = $16.67
User sees:            "$16.67/month (Billed $200/year)"
Payment:              One-time $200 charge
Renewal:              Every 12 months
```

### ENTERPRISE Pricing
```
Annual Price (DB):    $250.00
Monthly Display:      $250 ÷ 12 = $20.83
User sees:            "$20.83/month (Billed $250/year)"
Payment:              One-time $250 charge
Renewal:              Every 12 months
```

---

## 🔐 Billing Logic

### On Subscription Purchase

```
1. User selects plan (sees monthly display)
2. Checkout shows annual billing amount
3. User pays FULL ANNUAL amount
4. Subscription activated for 12 months
5. Auto-renewal set for 12 months later
```

### No Monthly Billing

```
❌ NOT $12.50 every month
✅ YES $150 one-time annual payment

❌ NOT recurring monthly charges
✅ YES annual renewal only
```

---

## 📝 Marketing Messages

### STARTER
> "Only $12.50/month. Annual billing at $150/year. Perfect for small pharmacies."

### PROFESSIONAL
> "Just $16.67/month. Billed $200/year. Includes Wholesale & API access."

### ENTERPRISE
> "Premium at $20.83/month. Full $250/year billing. Dedicated support included."

---

## ✅ Implementation Checklist

### Backend
- [x] API returns `price_monthly` field
- [x] API returns `display_as_monthly: true`
- [ ] Verify calculations correct

### Frontend
- [ ] Display price as monthly equivalent
- [ ] Show "(Billed $XXX/year)" subtitle
- [ ] Show annual billing in checkout
- [ ] Show renewal date

### Checkout
- [ ] Display annual total before payment
- [ ] Show "You'll be billed $150 annually"
- [ ] Show renewal date

### Documentation
- [ ] Update customer help docs
- [ ] Clarify annual billing in FAQ

---

## 🎊 Summary

**3 Plans Only**:
- STARTER: $150/year (display as $12.50/month)
- PROFESSIONAL: $200/year (display as $16.67/month)
- ENTERPRISE: $250/year (display as $20.83/month)

**Display Strategy**:
- Show monthly to users (feels affordable)
- Bill annual to business (stable revenue)
- No separate monthly plan
- Simple, clean pricing structure

**Status**: ✅ Ready for Frontend Implementation

---

**Prepared By**: Phermex Development Team  
**Date**: November 4, 2026  
**Status**: PRODUCTION READY ✅
