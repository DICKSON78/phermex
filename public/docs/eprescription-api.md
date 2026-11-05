# e-Prescription API - Complete Integration Guide

## 🏥 Overview

The Helix e-Prescription API enables MoH health systems to digitize prescription workflows with real-time delivery tracking and wholesale ordering.

**Key Features:**
- ✅ Submit e-prescriptions from healthcare facilities
- ✅ Track fulfillment across any pharmacy network
- ✅ Real-time delivery tracking with location history
- ✅ Automatic wholesale order generation
- ✅ QR code generation for patient access
- ✅ Multi-system integration (Laravel, Node.js, Spring Boot)

## 🔐 Authentication

All requests require Bearer token authentication:

```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

### Getting Your API Key
1. Contact: api@helix.co.tz
2. Provide system type (Laravel/Node.js/Spring Boot)
3. Receive API key via secure channel
4. Test with `/validate-key` endpoint

## 📡 Endpoints

### POST /api/eprescriptions/submit
Submit new e-prescription

### GET /api/eprescriptions/{id}
Retrieve prescription details

### POST /api/eprescriptions/{id}/fulfill
Mark prescription as dispensed

### POST /api/eprescriptions/{id}/wholesale-order
Create wholesale order

### GET /api/eprescriptions/{id}/delivery-status
Track delivery in real-time

### POST /api/eprescriptions/validate-key
Validate API key connection

