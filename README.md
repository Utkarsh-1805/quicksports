# QuickCourt - Sports Court Booking Platform

A comprehensive full-stack sports court booking platform built with Next.js 16, React 19, Prisma ORM, and PostgreSQL. Connect players with venue owners through an intuitive booking experience.

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.3-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)

---

## 🏸 Overview

QuickCourt is a full-featured sports facility booking platform that enables users to discover nearby courts, check real-time availability, book slots, make secure payments, and leave reviews. Venue owners get a complete management dashboard, while admins have full platform control.

### ✨ Key Features

#### 👤 For Players
- **Smart Search** - Find venues by location, sport, price, rating with geolocation support
- **Real-time Booking** - Interactive calendar with live availability
- **Secure Payments** - Razorpay integration with multiple payment methods
- **QR Code Tickets** - Digital booking confirmation with scannable QR codes
- **Favorites** - Save and manage favorite venues
- **Coupon System** - Apply discount codes during checkout
- **Reviews & Ratings** - Share experiences with verified booking badges
- **Email Confirmations** - Instant booking confirmations via email

#### 🏢 For Venue Owners
- **Dashboard Analytics** - Revenue charts, booking trends, performance metrics
- **Facility Management** - Add/edit venues, courts, photos, amenities
- **Booking Calendar** - Visual calendar view of all reservations
- **Earnings Tracking** - Detailed revenue reports with period filters
- **Review Management** - Respond to customer reviews
- **Court Configuration** - Set pricing, operating hours, sport types

#### 👨‍💼 For Administrators
- **User Management** - View, manage, and moderate user accounts
- **Facility Approvals** - Review and approve/reject new venue listings
- **Revenue Analytics** - Platform-wide financial insights
- **Content Moderation** - Review flagging and moderation system
- **Global Bookings** - Monitor all platform bookings
- **Report Handling** - Manage user reports and disputes

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | Full-stack React framework with App Router |
| **React 19** | UI library with latest features |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **Lucide React** | Modern icon library |
| **Recharts** | Data visualization charts |
| **Framer Motion** | Animations and transitions |
| **React Hook Form** | Form state management |
| **React Hot Toast** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | RESTful API endpoints |
| **Prisma ORM 7** | Type-safe database access |
| **PostgreSQL (Neon)** | Cloud-hosted database |
| **Zod** | Schema validation |
| **JWT** | Authentication tokens |
| **Razorpay** | Payment gateway |
| **Nodemailer** | Email service |
| **QRCode** | Booking QR generation |

---

## 📁 Project Structure

```
quickcourt/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── admin/            # Admin management APIs
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   ├── bookings/         # Booking system
│   │   │   ├── coupons/          # Coupon management
│   │   │   ├── courts/           # Court management
│   │   │   ├── favorites/        # User favorites
│   │   │   ├── notifications/    # Notification system
│   │   │   ├── owner/            # Owner portal APIs
│   │   │   ├── payments/         # Payment processing
│   │   │   ├── reports/          # Report system
│   │   │   ├── sports/           # Sports data
│   │   │   ├── upload/           # File uploads
│   │   │   ├── users/            # User management
│   │   │   └── venues/           # Venue & search APIs
│   │   ├── admin/                # Admin pages
│   │   ├── auth/                 # Auth pages (login, register, verify)
│   │   ├── booking/              # Booking flow pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── owner/                # Owner portal pages
│   │   └── venues/               # Venue listing & detail pages
│   ├── components/
│   │   ├── admin/                # Admin dashboard components
│   │   ├── auth/                 # Auth guards & forms
│   │   ├── booking/              # Booking flow components
│   │   ├── dashboard/            # User dashboard components
│   │   ├── landing/              # Homepage components
│   │   ├── layout/               # Navbar, Footer, Sidebar
│   │   ├── owner/                # Owner portal components
│   │   ├── ui/                   # Reusable UI components
│   │   └── venues/               # Venue cards, filters, gallery
│   ├── contexts/                 # React contexts (Auth)
│   ├── lib/                      # Utilities (auth, prisma, mail)
│   ├── prisma/
│   │   └── schema/               # Database schema
│   ├── services/                 # Business logic services
│   └── validations/              # Zod validation schemas
├── docs/                         # API documentation
├── scripts/                      # Seed & utility scripts
└── public/                       # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- Razorpay account (for payments)
- Gmail account with App Password (for emails)

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

   Configure your `.env` file:
   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

   # Authentication
   JWT_SECRET="your-secure-secret-key"

   # Email (Gmail SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM="QuickCourt <your-email@gmail.com>"

   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your-secret
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
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

   Visit `http://localhost:3000`

---

## 📱 Application Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with search & featured venues |
| Login | `/auth/login` | User authentication |
| Register | `/auth/register` | New user registration |
| Verify OTP | `/auth/verify-otp` | Email verification |
| Venues | `/venues` | Browse & search all venues |
| Venue Detail | `/venues/[id]` | Venue info, courts, reviews |
| Booking | `/booking/[courtId]` | Multi-step booking flow |
| User Dashboard | `/dashboard` | User bookings & favorites |
| Owner Dashboard | `/owner/dashboard` | Owner analytics & management |
| Owner Facilities | `/owner/facilities` | Manage venues & courts |
| Owner Bookings | `/owner/bookings` | View facility bookings |
| Owner Analytics | `/owner/analytics` | Revenue & performance |
| Admin Dashboard | `/admin` | Platform overview |
| Admin Users | `/admin/users` | User management |
| Admin Facilities | `/admin/facilities` | Venue approvals |
| Admin Moderation | `/admin/moderation` | Content moderation |

---

## 🔌 API Endpoints

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
| GET | `/api/venues/[id]` | Get venue details |
| GET | `/api/venues/search` | Advanced search |
| POST | `/api/venues/search/available` | Search with availability |
| GET | `/api/venues/nearby` | Find nearby venues |
| GET | `/api/venues/suggestions` | Autocomplete |
| GET | `/api/venues/trending` | Trending venues |
| GET | `/api/venues/cities` | Featured cities |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | User's bookings |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/[id]` | Booking details |
| POST | `/api/bookings/[id]/cancel` | Cancel booking |
| POST | `/api/bookings/[id]/pay` | Initiate payment |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/verify` | Verify Razorpay payment |
| POST | `/api/payments/webhook` | Razorpay webhook |
| GET | `/api/payments/history` | Payment history |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user favorites |
| POST | `/api/favorites` | Add/remove favorite |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coupons` | List available coupons |
| POST | `/api/coupons/apply` | Apply coupon to booking |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues/[id]/reviews` | Venue reviews |
| POST | `/api/venues/[id]/reviews` | Add review |
| PUT | `/api/venues/[id]/reviews/[reviewId]` | Update review |
| DELETE | `/api/venues/[id]/reviews/[reviewId]` | Delete review |
| POST | `/api/venues/[id]/reviews/[reviewId]/response` | Owner response |

### Owner APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/dashboard` | Dashboard stats |
| GET | `/api/owner/earnings` | Revenue data |
| GET | `/api/owner/courts` | Manage courts |
| GET | `/api/owner/reviews` | Facility reviews |

### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/[id]/role` | Update role |
| GET | `/api/admin/venues` | Manage venues |
| PUT | `/api/admin/venues/[id]` | Approve/reject |
| GET | `/api/admin/reviews` | Moderate reviews |

---

## 💳 Payment Flow

```
1. Select Time Slots → User picks date & time
2. Enter Details → Confirm booking info
3. Apply Coupon → Optional discount
4. Initiate Payment → POST /api/bookings/[id]/pay
5. Razorpay Checkout → Client-side payment
6. Verify Payment → POST /api/payments/verify
7. Confirmation → Email + QR code generated
```

### Fee Structure
- **Convenience Fee**: 2% of booking amount
- **GST**: 18% on (booking + convenience fee)

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **USER** | Browse, search, book, pay, review, favorites |
| **FACILITY_OWNER** | All USER + manage venues, courts, respond to reviews, view earnings |
| **ADMIN** | Full platform access, user management, moderation, analytics |

---

## 🏟️ Supported Sports

- 🏸 Badminton
- 🎾 Tennis
- 🏀 Basketball
- ⚽ Football
- 🏓 Table Tennis
- 🏊 Swimming
- 🏏 Cricket
- 🏐 Volleyball
- 🎱 Squash

---

## 📊 Database Models

| Model | Description |
|-------|-------------|
| **User** | Users with roles, preferences, auth |
| **Facility** | Venues with location, amenities, photos |
| **Court** | Courts with sport type, pricing, hours |
| **TimeSlot** | Bookable time slots |
| **Booking** | Reservations linking user, court, slot |
| **Payment** | Transaction records with Razorpay data |
| **Review** | Ratings with owner responses |
| **Favorite** | User saved venues |
| **Coupon** | Discount codes with rules |
| **Notification** | In-app & email notifications |
| **Report** | User reports for moderation |
| **Refund** | Refund tracking |

---

## 🔍 Search Features

### Query Parameters
```
GET /api/venues/search?
  search=badminton        # Text search
  &city=Delhi             # City filter
  &sportType=BADMINTON    # Sport filter
  &minPrice=200           # Min price/hour
  &maxPrice=500           # Max price/hour
  &minRating=4            # Min rating (1-5)
  &amenities=wifi,parking # Amenity IDs
  &latitude=28.6139       # User latitude
  &longitude=77.2090      # User longitude
  &radius=5               # Search radius (km)
  &sortBy=rating          # Sort: relevance, price_low, price_high, rating, distance
  &page=1                 # Pagination
  &limit=10
```

### Geolocation
Uses **Haversine formula** for accurate distance calculation between coordinates.

---

## ⭐ Review System

- **Wilson Score Ranking** - Statistically fair review ordering
- **Verified Booking Badge** - Shows if reviewer has booked
- **Owner Responses** - Venue owners can respond publicly
- **Helpful Votes** - Community can upvote reviews
- **Flagging System** - Report inappropriate content
- **Admin Moderation** - Review approval workflow

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `SMTP_HOST` | ✅ | Email server (smtp.gmail.com) |
| `SMTP_PORT` | ✅ | Email port (587) |
| `SMTP_USER` | ✅ | Email address |
| `SMTP_PASS` | ✅ | Email app password |
| `EMAIL_FROM` | ✅ | Sender name & email |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Webhook verification |

---

## 🧪 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database operations
npx prisma db push      # Push schema changes
npx prisma studio       # Open Prisma Studio
npx prisma generate     # Generate client
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Utkarsh Pandey**

- GitHub: [@Utkarsh-1805](https://github.com/Utkarsh-1805)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Database ORM
- [Razorpay](https://razorpay.com) - Payment gateway
- [Neon](https://neon.tech) - PostgreSQL hosting
- [Radix UI](https://radix-ui.com) - UI primitives
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons
