# QuickCourt — Manual Verification Checklist

Last updated: 2026-05-30

Automated tests already passing:
- ✅ Unit tests: `3 files, 26/26 tests` (`npm test`)
- ✅ E2E API suite: `54/54 pass, 0 failed` (`npm run test:e2e`)
- ✅ Production build: `89 routes compiled, 0 errors` (`npm run build`)

What follows are the **manual checks** that automation can't cover — UI flows, third-party integrations, and human-eye QA.

---

## How to use this file

1. Run each section in order.
2. Tick the box when it passes.
3. If something fails, note it under that section and stop — fix before continuing.

Requirements before you start:
- `npm run dev` is running on `http://localhost:3000`
- You're logged in as **owner** for the owner checks, **player** for player checks, **admin** for admin checks
- DB is reachable, `.env` is populated (Cloudinary creds confirmed present)

---

## A. Two recently-fixed bugs (highest priority)

### A1. Add facility with blank lat/lng
- [ ] Log in as owner
- [ ] Go to `/owner/facilities/new`
- [ ] Fill in name, description, address, city, state, pincode, at least one sport, at least one amenity, one photo
- [ ] **Leave latitude and longitude EMPTY**
- [ ] Click **Submit**
- [ ] **Expected:** facility is created, redirects to facilities list, no 500 error
- [ ] **Previously failed because:** `coordinateSchema` rejected `null`

### A2. Edit a facility, then re-open it
- [ ] Go to `/owner/facilities`
- [ ] Click the pencil icon on any facility
- [ ] Change any field, click **Save**
- [ ] Click the pencil icon on the same facility again
- [ ] **Expected:** edit form loads with current values, no 404
- [ ] **Previously failed because:** GET `/api/venues/[id]` only allowed APPROVED status; owners now see their own PENDING/REJECTED too

---

## B. Cloudinary upload (credentials are in .env)

### B1. Profile photo
- [ ] Log in as any user
- [ ] Go to `/dashboard/profile`
- [ ] Click **Change photo** (or the avatar)
- [ ] Pick any image, save
- [ ] Open DevTools → Network or Elements → find the new `<img src=…>`
- [ ] **Expected:** URL starts with `https://res.cloudinary.com/`
- [ ] **If it starts with `/uploads/avatars/…`** → Cloudinary env vars aren't being read; restart the dev server

### B2. Facility photos
- [ ] Log in as owner, open a facility's edit page
- [ ] Drag a JPG into the photo manager
- [ ] **Expected:** new photo appears, URL is `https://res.cloudinary.com/…`
- [ ] Drag-reorder photos — order persists after refresh
- [ ] Delete a photo — gone after refresh

---

## C. Booking + Payment flow (Razorpay test mode)

### C1. Discover → book
- [ ] As player, go to `/venues`
- [ ] Apply a filter (sport, city, price range) — list updates
- [ ] Click a venue → venue detail page loads with map, photos, reviews
- [ ] Click **Book Now** on a court
- [ ] Pick a future date, pick an available slot
- [ ] **Expected:** booking summary shows total + processing fee

### C2. Pay (Razorpay test mode)
- [ ] Click **Pay**
- [ ] Razorpay checkout modal opens
- [ ] Use test card: **4111 1111 1111 1111**, any future expiry, any CVV, any name
- [ ] Submit
- [ ] **Expected:** redirected to `/booking/confirmation/[bookingId]`, status = "Confirmed"
- [ ] Open `/dashboard/bookings` — the new booking shows there

### C3. Cancel + refund
- [ ] On `/dashboard/bookings`, click **Cancel** on a future booking
- [ ] **Expected:**
  - Booking moves to "Cancelled"
  - Refund amount shown matches refund-tier rule:
    - 24h+ before slot → 100%
    - 12–24h before → 50%
    - < 12h → 0%

---

## D. Live slot updates (SSE)

- [ ] Open `/venues/[id]` in **two browser windows** side by side
- [ ] In window 1, start booking a slot but don't pay yet
- [ ] In window 2, watch the slot grid for that same court + date
- [ ] **Expected:** within ~3 seconds, the slot you're booking in window 1 turns "Pending" / unavailable in window 2 — no refresh needed
- [ ] Pulse indicator (`.live-dot`) should be visible and animating

---

## E. Map view

- [ ] Go to `/venues/map`
- [ ] **Expected:** OpenStreetMap tiles load, markers appear for venues with coordinates
- [ ] Click a marker → popup shows venue name + link
- [ ] Pan + zoom — tiles re-fetch smoothly
- [ ] No console errors about Leaflet

---

## F. Match-making

### F1. Create open match
- [ ] As player, complete a booking (C1+C2)
- [ ] On `/dashboard/bookings`, click **Open to others** (or similar)
- [ ] Set capacity (e.g. 4) and skill level
- [ ] **Expected:** booking now appears on `/matches`

### F2. Join match
- [ ] Log in as a **different** player
- [ ] Go to `/matches`
- [ ] Find the match from F1, click **Join**
- [ ] **Expected:** participant count goes up, you appear in the participants list
- [ ] Try to join again → blocked (already joined)

---

## G. Owner dashboard

- [ ] Log in as owner
- [ ] `/owner/dashboard` — KPI cards (total bookings, revenue, occupancy) show real numbers
- [ ] `/owner/earnings` — chart renders, period selector works
- [ ] `/owner/analytics` — 24×7 heatmap renders, per-court breakdown visible
- [ ] `/owner/reviews` — reviews list with reply button; replying saves and shows the response on the public venue page

---

## H. Admin console

- [ ] Log in as admin
- [ ] `/admin` — overview KPIs
- [ ] `/admin/approvals` — pending facilities listed; approve one → it appears on public `/venues`
- [ ] `/admin/moderation` — flagged reviews listed; remove one → gone from venue page
- [ ] `/admin/users` — list, role change works
- [ ] `/admin/revenue` — revenue chart renders
- [ ] `/admin/bookings` — bookings table loads with filters

---

## I. Auth + account

### I1. Register + OTP
- [ ] Go to `/auth/register`, sign up with a fresh email
- [ ] Check inbox → OTP email arrives
- [ ] Enter OTP on `/auth/verify-otp`
- [ ] **Expected:** logged in, redirected to dashboard

### I2. Forgot/change password
- [ ] On `/dashboard/profile`, change password with current + new password
- [ ] Log out, log back in with new password — works
- [ ] Old password no longer works

### I3. Deactivate account
- [ ] On `/dashboard/profile`, click **Deactivate account**
- [ ] Enter password
- [ ] **Expected:** logged out, account `isActive=false` in DB
- [ ] Try to log in again → blocked

---

## J. Mobile + responsive

Open Chrome DevTools → Device Toolbar → test at 375×667 (iPhone SE) and 768×1024 (iPad).

- [ ] Homepage — hero + featured venues stack cleanly
- [ ] Navbar collapses to hamburger, opens drawer, links work
- [ ] Venue detail — photo gallery swipes, info stacks
- [ ] Booking flow — slot grid scrolls horizontally, date picker usable
- [ ] Dashboard — tables become cards or scroll horizontally
- [ ] No horizontal page scroll on any view

---

## K. Dark mode

- [ ] Toggle theme switcher (top-right in navbar)
- [ ] **Expected:** entire UI switches palette — backgrounds, text, cards, buttons, slot states
- [ ] Re-load page — theme persists (localStorage)
- [ ] Spot-check the booking flow, owner dashboard, admin console — no light-mode bleed-through

---

## L. Logger + observability

### L1. Logger smoke
- [ ] Stop dev server
- [ ] Run: `$env:LOG_LEVEL = "debug"; npm run dev` (PowerShell)
  - or `set LOG_LEVEL=debug && npm run dev` (cmd)
- [ ] Hit any API endpoint (e.g. open homepage)
- [ ] **Expected:** structured JSON logs in stdout
- [ ] In a log line that includes `password` or `token`, value should appear as `[REDACTED]`

### L2. Sentry (only if you've added DSN)
- [ ] `npm i @sentry/nextjs`
- [ ] Add `SENTRY_DSN=https://…` to `.env`
- [ ] Restart, trigger an error (e.g. malformed POST body)
- [ ] **Expected:** error appears in your Sentry dashboard within 1 min
- [ ] **Without DSN:** no-op, no crashes, dev never depends on it

---

## M. Lint + types (informational only)

- [ ] `npm run lint`
- [ ] **Expected:** ~35 warnings (pre-existing `<img>` and `useEffect` deps), 0 errors
- [ ] Warnings are tracked in [TODO.md](TODO.md) roadmap — non-blocking

---

## N. Docker (optional — only if you plan to deploy via container)

- [ ] `docker compose up --build`
- [ ] **Expected:**
  - Postgres container starts, healthcheck passes
  - App container builds, runs `prisma db push`, starts on `:3000`
  - `http://localhost:3000` loads
- [ ] Stop with Ctrl-C, run `docker compose down` to clean up

---

## When everything above is green

The app is **deploy-ready**. Options:

1. **Vercel** — import repo, paste env vars from `.env`, deploy. ([README](README.md#vercel) has the steps.)
2. **Docker / VPS** — `docker compose up -d --build` on the server.

Post-deploy smoke check on prod URL: hit `/`, register a test user, log in, view a venue. If all four work, you're live.

---

## If something fails

1. Note which check (e.g. "C2 — Razorpay modal didn't open")
2. Check browser console + dev server stdout for errors
3. If it's an env-var issue → `.env` and restart
4. If it's a code issue → tell me which check + the error, I'll fix it
