# QuickCourt Authentication API Documentation

## Overview
The authentication system provides user registration, login, email verification via OTP, and JWT-based authentication.

## Base URL
```
http://localhost:3000/api/auth
```

## Authentication Endpoints

### 1. Register User
**POST** `/register`

Register a new user and send email verification OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123",
  "name": "John Doe",
  "phone": "+1234567890"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "clx...",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isVerified": false,
      "createdAt": "2026-01-26T..."
    },
    "otpExpiry": "2026-01-26T...",
    "otpCode": "123456"  // Only in development
  },
  "timestamp": "2026-01-26T..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123",
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

---

### 2. Verify OTP
**POST** `/verify-otp`

Verify email using the OTP code sent during registration.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "type": "EMAIL_VERIFICATION"  // Optional, defaults to EMAIL_VERIFICATION
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "success": true,
    "user": {
      "id": "clx...",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isVerified": true,
      "createdAt": "2026-01-26T..."
    }
  },
  "timestamp": "2026-01-26T..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "code": "123456"
  }'
```

---

### 3. Login
**POST** `/login`

Login with email and password to get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx...",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isVerified": true,
      "createdAt": "2026-01-26T...",
      "updatedAt": "2026-01-26T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-26T..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

---

### 4. Resend OTP
**POST** `/resend-otp`

Resend OTP for email verification or password reset.

**Request Body:**
```json
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"  // Or "PASSWORD_RESET"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otpExpiry": "2026-01-26T...",
    "otpCode": "123456"  // Only in development
  },
  "timestamp": "2026-01-26T..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "type": "EMAIL_VERIFICATION"
  }'
```

---

### 5. Get User Profile
**GET** `/me`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "clx...",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isVerified": true,
      "createdAt": "2026-01-26T...",
      "updatedAt": "2026-01-26T..."
    }
  },
  "timestamp": "2026-01-26T..."
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "timestamp": "2026-01-26T..."
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

---

## Validation Rules

### Registration
- **email**: Valid email format, required
- **password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **name**: 2-50 characters, required
- **phone**: Optional, valid phone number format if provided

### Login
- **email**: Valid email format, required
- **password**: Required

### OTP Verification
- **email**: Valid email format, required  
- **code**: 6-digit number, required

---

## Testing Workflow

1. **Register a user**
2. **Verify OTP** (use the OTP returned in development)
3. **Login** to get access token
4. **Access protected routes** using the token

Note: In development mode, OTP codes are returned in API responses for testing. In production, they're only sent via email.