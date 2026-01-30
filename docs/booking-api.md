# Booking System API Documentation

Complete guide for QuickCourt's booking system APIs.

## Overview

The booking system allows users to:
1. Check court availability for a specific date
2. Create bookings for available time slots
3. View their booking history
4. Cancel upcoming bookings

All booking endpoints (except availability check) require authentication.

## Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Check Court Availability

Check available time slots for a court on a specific date.

### Endpoint
```
GET /api/courts/{courtId}/availability?date=YYYY-MM-DD
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| courtId | path | Yes | The court ID |
| date | query | Yes | Date in YYYY-MM-DD format |

### Example Request
```http
GET /api/courts/court-021/availability?date=2025-01-28
```

### Example Response
```json
{
  "success": true,
  "court": {
    "id": "court-021",
    "name": "Tennis Court 1",
    "sportType": "TENNIS",
    "pricePerHour": 500,
    "facility": {
      "id": "facility-006",
      "name": "Delhi Sports Hub",
      "city": "Delhi",
      "address": "Sector 15, Dwarka"
    }
  },
  "date": "2025-01-28",
  "operatingHours": {
    "opening": "06:00",
    "closing": "22:00"
  },
  "slots": [
    { "startTime": "06:00", "endTime": "07:00", "status": "available" },
    { "startTime": "07:00", "endTime": "08:00", "status": "available" },
    { "startTime": "08:00", "endTime": "09:00", "status": "booked", "reason": "Already booked" },
    { "startTime": "09:00", "endTime": "10:00", "status": "available" },
    // ... more slots
  ],
  "summary": {
    "total": 16,
    "available": 14,
    "booked": 2,
    "blocked": 0,
    "past": 0
  }
}
```

### Slot Statuses
| Status | Description |
|--------|-------------|
| available | Can be booked |
| booked | Already has a booking |
| blocked | Blocked for maintenance |
| past | Time has already passed (for today) |

---

## 2. Create Booking

Create a new booking for a court.

### Endpoint
```
POST /api/bookings
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "courtId": "court-021",
  "date": "2025-01-28",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

### Validation Rules
- `date`: Must be YYYY-MM-DD format, cannot be in the past
- `startTime`: Must be HH:MM format (24-hour)
- `endTime`: Must be after startTime, minimum 1 hour booking
- Time must be within court's operating hours

### Example Response (Success)
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": "booking-abc123",
    "status": "PENDING",
    "date": "2025-01-28",
    "startTime": "10:00",
    "endTime": "12:00",
    "totalAmount": 1000,
    "court": {
      "id": "court-021",
      "name": "Tennis Court 1",
      "sportType": "TENNIS",
      "pricePerHour": 500,
      "facility": {
        "id": "facility-006",
        "name": "Delhi Sports Hub",
        "city": "Delhi",
        "address": "Sector 15, Dwarka"
      }
    },
    "user": {
      "id": "user-001",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2025-01-27T10:30:00.000Z"
  },
  "nextSteps": {
    "message": "Complete payment to confirm your booking",
    "paymentUrl": "/api/bookings/booking-abc123/pay",
    "viewUrl": "/api/bookings/booking-abc123",
    "cancelUrl": "/api/bookings/booking-abc123/cancel"
  }
}
```

### Error Responses

**Time Conflict (409)**
```json
{
  "success": false,
  "message": "Time slot is not available",
  "reason": "This time slot overlaps with an existing booking",
  "hint": "Please check availability and choose a different time"
}
```

**Outside Operating Hours (400)**
```json
{
  "success": false,
  "message": "Booking time is outside operating hours",
  "operatingHours": { "opening": "06:00", "closing": "22:00" },
  "requested": { "startTime": "05:00", "endTime": "06:00" }
}
```

---

## 3. List My Bookings

Get paginated list of authenticated user's bookings.

### Endpoint
```
GET /api/bookings
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter: PENDING, CONFIRMED, CANCELLED, COMPLETED |
| upcoming | string | - | "true" for future, "false" for past |
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 50) |

### Example Requests
```http
# All bookings
GET /api/bookings

# Upcoming confirmed bookings
GET /api/bookings?status=CONFIRMED&upcoming=true

# Past bookings, page 2
GET /api/bookings?upcoming=false&page=2&limit=20
```

### Example Response
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking-abc123",
      "status": "CONFIRMED",
      "date": "2025-01-28",
      "startTime": "10:00",
      "endTime": "12:00",
      "totalAmount": 1000,
      "court": {
        "id": "court-021",
        "name": "Tennis Court 1",
        "sportType": "TENNIS",
        "pricePerHour": 500,
        "facility": {
          "id": "facility-006",
          "name": "Delhi Sports Hub",
          "city": "Delhi",
          "address": "Sector 15, Dwarka"
        }
      },
      "createdAt": "2025-01-27T10:30:00.000Z",
      "updatedAt": "2025-01-27T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

## 4. Get Booking Details

Get detailed information about a specific booking.

### Endpoint
```
GET /api/bookings/{bookingId}
```

### Example Request
```http
GET /api/bookings/booking-abc123
Authorization: Bearer <token>
```

### Example Response
```json
{
  "success": true,
  "booking": {
    "id": "booking-abc123",
    "status": "CONFIRMED",
    "date": "2025-01-28",
    "startTime": "10:00",
    "endTime": "12:00",
    "totalAmount": 1000,
    "paymentId": "pay_xyz789",
    "court": {
      "id": "court-021",
      "name": "Tennis Court 1",
      "sportType": "TENNIS",
      "pricePerHour": 500,
      "images": [],
      "facility": {
        "id": "facility-006",
        "name": "Delhi Sports Hub",
        "address": "Sector 15, Dwarka",
        "city": "Delhi",
        "state": "Delhi",
        "phone": "+91-9876543210",
        "email": "contact@delhisportshub.com"
      }
    },
    "user": {
      "id": "user-001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91-9876543210"
    },
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:35:00.000Z"
  },
  "meta": {
    "isUpcoming": true,
    "isPast": false,
    "canCancel": true,
    "canPay": false,
    "viewerRole": "user"
  },
  "actions": {
    "cancelUrl": "/api/bookings/booking-abc123/cancel"
  }
}
```

---

## 5. Cancel Booking

Cancel an existing booking.

### Endpoint
```
PATCH /api/bookings/{bookingId}/cancel
```

### Request Body (Optional)
```json
{
  "reason": "Change of plans"
}
```

### Example Request
```http
PATCH /api/bookings/booking-abc123/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Change of plans"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "booking-abc123",
    "status": "CANCELLED",
    "date": "2025-01-28",
    "startTime": "10:00",
    "endTime": "12:00",
    "totalAmount": 1000,
    "court": {
      "id": "court-021",
      "name": "Tennis Court 1",
      "sportType": "TENNIS",
      "facility": {
        "id": "facility-006",
        "name": "Delhi Sports Hub",
        "city": "Delhi"
      }
    }
  },
  "refund": {
    "wasPaymentMade": true,
    "refundPercentage": 100,
    "refundAmount": 1000,
    "policy": "Full refund - cancelled 24+ hours before booking",
    "cancellationReason": "Change of plans"
  },
  "cancelledBy": {
    "userId": "user-001",
    "role": "user"
  }
}
```

### Cancellation Rules
- Cannot cancel past bookings
- Cannot cancel already cancelled/completed bookings
- Only booking owner, facility owner, or admin can cancel

### Refund Policy
| Time Before Booking | Refund |
|---------------------|--------|
| 24+ hours | 100% |
| 12-24 hours | 50% |
| < 12 hours | 0% |

---

## Booking Status Flow

```
PENDING → (payment) → CONFIRMED → (completed) → COMPLETED
    ↓                      ↓
 (cancel)              (cancel)
    ↓                      ↓
CANCELLED              CANCELLED
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Time slot already booked |
| 500 | Server Error |

---

## Postman Collection

### Test Variables
```
court_id = court-021
booking_date = 2025-01-28
auth_token = <your_jwt_token>
```

### Quick Test Flow
1. **Login** → Get token
2. **Check Availability** → Find available slot
3. **Create Booking** → Book the slot
4. **List Bookings** → Verify booking appears
5. **Get Details** → View full details
6. **Cancel** → Cancel the booking
