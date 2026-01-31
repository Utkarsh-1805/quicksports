# QuickCourt - Sports Court Booking Platform

A comprehensive backend API for booking sports courts and facilities. Built with Next.js 15, Prisma ORM, and PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.0+-purple)

---

## 🏸 Overview

QuickCourt is a full-featured sports facility booking platform that connects players with venue owners. Users can discover nearby courts, check real-time availability, book slots, make payments, and leave reviews.

### Key Features

- **🔐 Authentication** - JWT-based auth with OTP verification
- **🏟️ Venue Management** - Multi-sport facility listings with courts
- **📅 Smart Booking** - Real-time availability and slot management
- **💳 Payments** - Razorpay integration with refunds
- **⭐ Reviews & Ratings** - Wilson Score ranking with owner responses
- **🔍 Advanced Search** - Geolocation, filters, trending venues
- **👨‍💼 Admin Dashboard** - User management, moderation, analytics
- **📧 Notifications** - Email notifications for bookings and updates

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | API Routes with App Router |
| **Prisma ORM** | Database management |
| **PostgreSQL** | Primary database (Neon) |
| **Zod** | Input validation |
| **JWT** | Authentication |
| **Razorpay** | Payment gateway |
| **Nodemailer** | Email service |

---

## 📁 Project Structure

```
quickcourt/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/           # Authentication endpoints
│   │       ├── admin/          # Admin management APIs
│   │       ├── venues/         # Venue & court management
│   │       ├── bookings/       # Booking system
│   │       ├── payments/       # Payment processing
│   │       ├── sports/         # Sports data
│   │       └── home/           # Homepage data
│   ├── lib/                    # Utilities (auth, prisma, mail)
│   ├── services/               # Business logic services
│   ├── validations/            # Zod validation schemas
│   └── prisma/
│       └── schema/             # Database schema
├── docs/                       # API documentation
└── scripts/                    # Seed scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Utkarsh-1805/quicksports.git
   cd quickcourt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Configure these variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/dbname"

   # Authentication
   JWT_SECRET="your-secret-key"
   JWT_EXPIRES_IN="7d"

   # Email (SMTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # Razorpay
   RAZORPAY_KEY_ID="rzp_test_xxxxx"
   RAZORPAY_KEY_SECRET="your-secret"
   RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   ```

5. **Seed initial data (optional)**
   ```bash
   node scripts/seed-amenities.mjs
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Venues & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues` | List all venues |
| GET | `/api/venues/:id` | Get venue details |
| GET | `/api/venues/search` | Advanced search with filters |
| POST | `/api/venues/search/available` | Search with availability |
| GET | `/api/venues/nearby` | Find nearby venues |
| GET | `/api/venues/suggestions` | Autocomplete suggestions |
| GET | `/api/venues/trending` | Trending venues |
| GET | `/api/venues/cities` | Featured cities |
| GET | `/api/venues/filters` | Filter options |
| GET | `/api/venues/:id/similar` | Similar venues |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | User's bookings |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Booking details |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/bookings/:id/pay` | Initiate payment |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/verify` | Verify payment |
| POST | `/api/payments/webhook` | Razorpay webhook |
| GET | `/api/payments/history` | Payment history |
| GET | `/api/payments/receipts/:id` | Download receipt |
| GET | `/api/payments/methods` | Saved payment methods |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues/:id/reviews` | Venue reviews |
| POST | `/api/venues/:id/reviews` | Add review |
| PUT | `/api/venues/:id/reviews/:reviewId` | Update review |
| DELETE | `/api/venues/:id/reviews/:reviewId` | Delete review |
| POST | `/api/venues/:id/reviews/:reviewId/response` | Owner response |
| POST | `/api/venues/:id/reviews/:reviewId/helpful` | Mark helpful |
| POST | `/api/venues/:id/reviews/:reviewId/flag` | Flag review |

### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id/role` | Update user role |
| GET | `/api/admin/venues` | Manage venues |
| PUT | `/api/admin/venues/:id` | Approve/reject venue |
| GET | `/api/admin/reviews` | Moderate reviews |
| GET | `/api/admin/payments` | Payment management |
| POST | `/api/admin/payments/refund` | Process refund |
| GET | `/api/admin/analytics/search` | Search analytics |

### Owner APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/earnings` | Owner earnings dashboard |
| POST | `/api/venues` | Create venue |
| PUT | `/api/venues/:id` | Update venue |
| POST | `/api/venues/:id/courts` | Add court |
| POST | `/api/generate-timeslots` | Generate timeslots |

---

## 🔍 Search Features

### Advanced Search Parameters

```bash
GET /api/venues/search?search=badminton&city=Delhi&sportType=BADMINTON&minPrice=200&maxPrice=500&minRating=4&sortBy=rating&page=1&limit=10
```

| Parameter | Description |
|-----------|-------------|
| `search` | Text search (name, description, city) |
| `city` | Filter by city |
| `sportType` | Filter by sport type |
| `amenities` | Comma-separated amenity IDs |
| `minPrice` / `maxPrice` | Price range |
| `minRating` | Minimum rating (1-5) |
| `latitude` / `longitude` | User location |
| `radius` | Search radius in km |
| `sortBy` | relevance, price_low, price_high, rating, distance, reviews |

### Geolocation Search

Uses **Haversine formula** for accurate distance calculation:

```bash
GET /api/venues/nearby?latitude=28.6139&longitude=77.2090&radius=5&sportType=BADMINTON
```

---

## 💳 Payment Flow

1. **Create Booking** → `POST /api/bookings`
2. **Initiate Payment** → `POST /api/bookings/:id/pay`
3. **Complete on Razorpay** → Client-side
4. **Verify Payment** → `POST /api/payments/verify`
5. **Webhook Confirmation** → `POST /api/payments/webhook`

### Refund Process

- User requests cancellation → `POST /api/bookings/:id/cancel`
- Admin processes refund → `POST /api/admin/payments/refund`
- Razorpay processes → Automatic via API

---

## ⭐ Review System

### Features

- **Wilson Score Ranking** - Statistically fair review ordering
- **Owner Responses** - Venue owners can respond to reviews
- **Helpful Votes** - Users can mark reviews as helpful
- **Flagging System** - Report inappropriate reviews
- **Admin Moderation** - Approve/reject flagged reviews

### Rating Calculation

```javascript
// Wilson Score for confidence-based ranking
wilsonScore = (p + z²/2n - z√(p(1-p)/n + z²/4n²)) / (1 + z²/n)
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **USER** | Browse, book, pay, review |
| **FACILITY_OWNER** | Manage venues, courts, respond to reviews |
| **ADMIN** | Full access, moderation, analytics |

---

## 🏟️ Supported Sports

- Badminton
- Tennis
- Basketball
- Football
- Table Tennis
- Swimming
- Cricket
- Volleyball
- Squash
- Other

---

## 📊 Database Schema

### Core Models

- **User** - Authentication & profiles
- **Facility** - Venues with location & amenities
- **Court** - Individual courts within facilities
- **TimeSlot** - Available booking slots
- **Booking** - User bookings
- **Payment** - Transaction records
- **Review** - Ratings & reviews
- **Notification** - User notifications

---

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `SMTP_HOST` | Yes | Email server host |
| `SMTP_PORT` | Yes | Email server port |
| `SMTP_USER` | Yes | Email username |
| `SMTP_PASS` | Yes | Email password |
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Webhook verification |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Utkarsh**

- GitHub: [@Utkarsh-1805](https://github.com/Utkarsh-1805)

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Razorpay for payment processing
- Neon for PostgreSQL hosting
