# Wholesale Management System - Complete Guide

## 📚 Overview

The Helix Wholesale Management System enables:
- **Wholesalers** to manage inventory, pricing, orders, and returns
- **Retail Pharmacies** to purchase drugs in bulk at wholesale rates
- **Supply Chain Management** with real-time inventory tracking
- **Credit Management** with flexible payment terms
- **Analytics** for performance monitoring

---

## 🏢 Wholesaler Module

### Register Wholesaler

**POST** `/api/wholesale/register`

Register a new wholesaler in the system.

**Request:**
```json
{
  "name": "PharmHub Wholesalers Ltd",
  "email": "info@pharmhub.co.tz",
  "phone": "+255765432100",
  "address": "123 Industrial Park, Dar es Salaam",
  "city": "Dar es Salaam",
  "region": "Dar es Salaam",
  "license_number": "WHL-2026-00123",
  "registration_number": "REG-123456",
  "tax_id": "TAX-123456",
  "bank_account": "1234567890",
  "bank_name": "CRDB Bank",
  "contact_person": "John Manager",
  "contact_phone": "+255765432101"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Wholesaler registered successfully",
  "wholesaler_id": "WHOLE-ABC123",
  "status": "pending_approval"
}
```

### List Wholesalers

**GET** `/api/wholesale/list?status=active&city=Dar%20es%20Salaam`

List all wholesalers with optional filtering.

**Query Parameters:**
- `status` - active, inactive, suspended, pending
- `city` - Filter by city

**Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "wholesaler_id": "WHOLE-ABC123",
        "name": "PharmHub Wholesalers Ltd",
        "city": "Dar es Salaam",
        "rating": 4.85,
        "total_orders": 156,
        "on_time_delivery_rate": 98.5,
        "status": "active"
      }
    ],
    "total": 25,
    "per_page": 20
  }
}
```

---

## 📦 Inventory Management

### Update Inventory

**POST** `/api/wholesale/{wholesalerId}/inventory/update`

Update drug stock for a wholesaler.

**Request:**
```json
{
  "drug_id": "drug_12345",
  "drug_name": "Amoxicillin 500mg",
  "batch_number": "BATCH-001-2026",
  "quantity_in_stock": 5000,
  "minimum_stock_level": 500,
  "reorder_quantity": 2000,
  "unit_price": 45.50,
  "expiry_date": "2028-06-30",
  "manufacture_date": "2024-06-30",
  "location": "Shelf A-12"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory updated",
  "inventory": {
    "wholesaler_id": "WHOLE-ABC123",
    "drug_id": "drug_12345",
    "quantity_in_stock": 5000,
    "status": "available"
  }
}
```

### Get Inventory

**GET** `/api/wholesale/{wholesalerId}/inventory?status=low_stock&drug_id=drug_12345`

Retrieve inventory for wholesaler with filtering.

**Query Parameters:**
- `status` - available, low_stock, out_of_stock, expired
- `drug_id` - Filter by specific drug

**Response:**
```json
{
  "success": true,
  "wholesaler_id": "WHOLE-ABC123",
  "inventory": [
    {
      "drug_id": "drug_12345",
      "drug_name": "Amoxicillin 500mg",
      "quantity_in_stock": 5000,
      "minimum_stock_level": 500,
      "unit_price": 45.50,
      "expiry_date": "2028-06-30",
      "status": "available"
    }
  ],
  "total_items": 1
}
```

---

## 💰 Pricing Management

### Set Drug Pricing

**POST** `/api/wholesale/{wholesalerId}/pricing`

Set pricing for drugs with tiered discounts.

**Request:**
```json
{
  "drug_id": "drug_12345",
  "price": 45.50,
  "minimum_quantity": 100,
  "discount_percentage": 5,
  "valid_from": "2026-11-01",
  "valid_until": "2026-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pricing updated",
  "pricing": {
    "drug_id": "drug_12345",
    "price": 45.50,
    "minimum_quantity": 100,
    "discount_percentage": 5,
    "status": "active"
  }
}
```

**Pricing Rules:**
- Base price always stored
- Discounts applied per drug and minimum quantity
- Multiple tiers supported
- Valid date ranges enforced

---

## 📋 Order Management

### Create Wholesale Order

**POST** `/api/wholesale-orders/create`

Retail pharmacy creates order from wholesaler.

**Request:**
```json
{
  "source": "direct",
  "pharmacy_id": "PHARM001",
  "wholesaler_id": "WHOLE-ABC123",
  "items": [
    {
      "drug_id": "drug_12345",
      "drug_name": "Amoxicillin 500mg",
      "quantity": 500,
      "unit_price": 45.50
    },
    {
      "drug_id": "drug_67890",
      "drug_name": "Paracetamol 500mg",
      "quantity": 1000,
      "unit_price": 8.50
    }
  ],
  "delivery_address": "123 Pharmacy Lane, Dar es Salaam",
  "payment_method": "bank_transfer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order_id": "WO-20261105-ABC123",
  "status": "pending",
  "total_amount": 31225.00,
  "items_count": 2,
  "created_at": "2026-11-05T10:30:00Z"
}
```

### Get Order Details

**GET** `/api/wholesale-orders/{orderId}`

Retrieve complete order information.

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "WO-20261105-ABC123",
    "pharmacy_id": "PHARM001",
    "wholesaler_id": "WHOLE-ABC123",
    "status": "pending",
    "total_amount": 31225.00,
    "payment_method": "bank_transfer",
    "delivery_address": "123 Pharmacy Lane",
    "items": [
      {
        "drug_id": "drug_12345",
        "drug_name": "Amoxicillin 500mg",
        "quantity": 500,
        "unit_price": 45.50,
        "total_price": 22750.00,
        "quantity_received": 0
      }
    ],
    "payment": {
      "amount": 31225.00,
      "status": "pending",
      "payment_method": "bank_transfer"
    },
    "created_at": "2026-11-05T10:30:00Z"
  }
}
```

### Update Order Status

**POST** `/api/wholesale-orders/{orderId}/status`

Wholesaler updates order status through fulfillment stages.

**Status Workflow:**
1. **pending** → order received
2. **confirmed** → wholesaler confirmed
3. **packed** → items packed
4. **dispatched** → shipped to pharmacy
5. **delivered** → received by pharmacy
6. **cancelled** → order cancelled

**Request:**
```json
{
  "status": "dispatched",
  "delivery_partner": "FastLogistics",
  "tracking_number": "FL-TRACK-123456",
  "estimated_delivery_date": "2026-11-07"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated",
  "order_id": "WO-20261105-ABC123",
  "status": "dispatched",
  "tracking_number": "FL-TRACK-123456"
}
```

### List Wholesale Orders

**GET** `/api/wholesale-orders?pharmacy_id=PHARM001&wholesaler_id=WHOLE-ABC123&status=pending`

Query orders with filtering.

**Query Parameters:**
- `pharmacy_id` - Filter by pharmacy
- `wholesaler_id` - Filter by wholesaler
- `status` - Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": "WO-20261105-ABC123",
        "pharmacy_id": "PHARM001",
        "wholesaler_id": "WHOLE-ABC123",
        "status": "pending",
        "total_amount": 31225.00,
        "created_at": "2026-11-05T10:30:00Z"
      }
    ],
    "total": 45,
    "per_page": 20
  }
}
```

---

## ↩️ Returns & Refunds

### Request Return

**POST** `/api/wholesale/{wholesalerId}/returns/create`

Pharmacy requests return/refund for items.

**Request:**
```json
{
  "order_id": "WO-20261105-ABC123",
  "pharmacy_id": "PHARM001",
  "returned_items": [
    {
      "drug_id": "drug_12345",
      "quantity": 50,
      "reason": "defective"
    },
    {
      "drug_id": "drug_67890",
      "quantity": 100,
      "reason": "expired"
    }
  ],
  "reason": "defective",
  "description": "Items arrived with manufacturing defects. Packaging damaged, liquid leaking from bottles."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Return request submitted",
  "return_id": 1,
  "return_amount": 5475.00
}
```

### Approve/Reject Return

**POST** `/api/wholesale/{wholesalerId}/returns/{returnId}/approve`

Wholesaler processes return request.

**Request:**
```json
{
  "action": "approve",
  "notes": "Return approved. Refund will be processed in 5 business days."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Return approved. Refund will be processed in 5 days.",
  "return_id": 1,
  "refund_amount": 5475.00
}
```

**Return Reasons:**
- defective - Product defects
- expired - Expired before use date
- damaged - Damaged packaging/product
- wrong_item - Incorrect item shipped
- quality_issue - Quality not as described
- other - Other reasons

---

## 💳 Payments & Credit

### Make Payment

**POST** `/api/wholesale-orders/{orderId}/payment`

Record payment for wholesale order.

**Request:**
```json
{
  "amount": 31225.00,
  "payment_method": "bank_transfer",
  "transaction_reference": "TXN-2026-11-05-001",
  "notes": "Payment for order WO-20261105-ABC123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Payment recorded",
  "order_id": "WO-20261105-ABC123",
  "amount_paid": 31225.00,
  "transaction_reference": "TXN-2026-11-05-001"
}
```

### Set Credit Terms

**POST** `/api/wholesale/{wholesalerId}/credit-terms`

Wholesaler sets credit terms for pharmacy.

**Request:**
```json
{
  "pharmacy_id": "PHARM001",
  "credit_limit": 500000.00,
  "payment_terms_days": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credit terms set",
  "credit_terms": {
    "wholesaler_id": "WHOLE-ABC123",
    "pharmacy_id": "PHARM001",
    "credit_limit": 500000.00,
    "current_balance": 0.00,
    "payment_terms_days": 30,
    "status": "active"
  }
}
```

**Payment Methods:**
- bank_transfer - Direct bank transfer
- credit - Credit with agreed terms
- cash - Cash on delivery
- cheque - Cheque payment

---

## 📊 Analytics & Reporting

### Get Wholesaler Analytics

**GET** `/api/wholesale/{wholesalerId}/analytics`

Retrieve performance metrics for wholesaler.

**Response:**
```json
{
  "success": true,
  "wholesaler_id": "WHOLE-ABC123",
  "analytics": {
    "total_orders": 156,
    "pending_orders": 3,
    "completed_orders": 148,
    "total_revenue": 4850000.00,
    "average_order_value": 31089.74,
    "completion_rate": "94.87%",
    "orders_by_status": {
      "pending": 3,
      "confirmed": 2,
      "packed": 5,
      "dispatched": 12,
      "delivered": 148,
      "cancelled": 5
    }
  }
}
```

---

## 🔐 Authentication

All wholesale endpoints require Bearer token authentication:

```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

---

## ⚡ Complete Workflow Example

### Step 1: Wholesaler Registers
```bash
POST /api/wholesale/register
→ Receives wholesaler_id: WHOLE-ABC123
```

### Step 2: Wholesaler Updates Inventory
```bash
POST /api/wholesale/WHOLE-ABC123/inventory/update
→ Adds 5000 units of Amoxicillin
```

### Step 3: Wholesaler Sets Pricing
```bash
POST /api/wholesale/WHOLE-ABC123/pricing
→ Sets price at 45.50 per unit, 5% discount for 100+ units
```

### Step 4: Retail Pharmacy Discovers Wholesaler
```bash
GET /api/wholesale/list?status=active
→ Sees WHOLE-ABC123 in results
```

### Step 5: Retail Pharmacy Creates Order
```bash
POST /api/wholesale-orders/create
→ Receives order_id: WO-20261105-ABC123
```

### Step 6: Wholesaler Confirms & Fulfills
```bash
POST /api/wholesale-orders/WO-20261105-ABC123/status
→ Updates to "dispatched" with tracking number
```

### Step 7: Retail Pharmacy Receives Order
```bash
POST /api/wholesale-orders/WO-20261105-ABC123/status
→ Wholesale updates to "delivered"
```

### Step 8: Retail Pharmacy Pays
```bash
POST /api/wholesale-orders/WO-20261105-ABC123/payment
→ Payment recorded
```

### Step 9: Analytics Available
```bash
GET /api/wholesale/WHOLE-ABC123/analytics
→ Views performance metrics
```

---

## 📱 Integration Examples

### Laravel
```php
$wholesaleOrder = Http::withToken($apiKey)
    ->post('https://helix.co.tz/api/wholesale-orders/create', [
        'source' => 'direct',
        'pharmacy_id' => 'PHARM001',
        'wholesaler_id' => 'WHOLE-ABC123',
        'items' => [...],
        'delivery_address' => '...',
        'payment_method' => 'bank_transfer'
    ])
    ->json();
```

### Node.js
```javascript
const response = await axios.post(
  'https://helix.co.tz/api/wholesale-orders/create',
  {
    source: 'direct',
    pharmacy_id: 'PHARM001',
    wholesaler_id: 'WHOLE-ABC123',
    items: [...],
    delivery_address: '...',
    payment_method: 'bank_transfer'
  },
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);
```

### Spring Boot
```java
Map<String, Object> requestBody = new HashMap<>();
requestBody.put("source", "direct");
requestBody.put("pharmacy_id", "PHARM001");
requestBody.put("wholesaler_id", "WHOLE-ABC123");
// ... add items, delivery_address, payment_method

ResponseEntity<Map> response = restTemplate.postForEntity(
  "https://helix.co.tz/api/wholesale-orders/create",
  new HttpEntity<>(requestBody, headers),
  Map.class
);
```

---

## ✅ Success Criteria

The wholesale system is complete when:

✅ Wholesalers can register and manage profile  
✅ Inventory tracking with stock levels  
✅ Dynamic pricing with bulk discounts  
✅ Retail pharmacies can place orders  
✅ Order workflow from pending to delivery  
✅ Returns and refund processing  
✅ Payment recording and credit terms  
✅ Real-time analytics and reporting  
✅ Multi-level user access (Wholesaler, Pharmacy, Admin)  
✅ Notification system for status updates  

---

## 📞 Support

For integration help or technical issues:
- **Email**: wholesale@helix.co.tz
- **Documentation**: https://helix.co.tz/docs/wholesale
- **Support Hours**: Mon-Fri, 9 AM - 5 PM EAT

