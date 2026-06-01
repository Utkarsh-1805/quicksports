# QuickCourt — Remaining Work

> Living checklist. Tick items as they're completed.
> Format: `[ ]` pending · `[x]` done · `[~]` partial / blocked

---

## Tier 1 — Finish what's half-done

### 1.1 Wire up unintegrated API methods
- [x] Owner Court CRUD UI — redesigned, full add/edit/delete on `/owner/facilities/[id]`
    - [x] **Fixed**: created missing `/api/courts/[id]` route (PUT/DELETE) — previously edit/delete returned "Court not found"
- [x] Owner facility photo upload UI — drag-drop multi-upload with cover-photo selector (new `FacilityPhotosManager` component, wired into Photos tab)
- [x] Notification preferences UI — load + save toggles at `/dashboard/profile` → Notifications tab
- [x] Account deactivation flow — modal with reason input at `/dashboard/profile` → Security tab
- [x] Timeslot blocking UI for owners — new "Blocked Slots" tab on each facility detail page (new `BlockSlotsManager` component, fully wired to `/api/courts/[id]/block-slots`)
- [x] Owner review responses — fixed two bugs (validation min 10→1 char; `review.venueId` was undefined → now falls back to `facilityId`/`facility.id`; field-level error now surfaces in alert)
- [x] Helpful-vote on reviews — thumbs-up pill on each review card in `VenueReviews`. API now hydrates `helpfulCount` + `userHasVoted` per-review
- [x] Refund request flow — `MyBookingsContent` auto-calls `/api/payments/refund` after a successful cancel and shows a banner (success / partial / no-refund / failed)
- [x] Nearby venues / cities / filters endpoints wired:
    - `HeroSearch` location field now has a city autocomplete (from `/api/venues/cities`) + a "Use my location" button (calls `/api/venues/nearby`, redirects to the closest venue's city)
    - `VenueFilters` now loads sports / amenities / cities dynamically from `/api/venues/filters` instead of the hardcoded arrays

### 1.2 Replace agent-flagged mock data with real API fields
- [x] Owner Reviews — `ratingDistribution` + `averageRating` now computed server-side (`/api/owner/reviews`), wired into OwnerReviewsContent
- [x] Owner Earnings — `nextPayoutDate` computed (next Friday) in `/api/owner/earnings`, subtitle now shows real date
- [x] Owner Analytics — `peakHoursByDay` computed in `/api/owner/dashboard`, heatmap reads real data with fallback to mock
- [x] Admin Revenue — `refunds: { count, amount, rate, avgAmount }` now populated. API now returns `overview.refundCount`; frontend derives rate + avg refund client-side

### 1.3 Host assets locally ✅
- [x] Replace Unsplash URLs in `src/app/page.js` hero with local `/hero/landing-hero.jpg`
- [x] Replace Unsplash URL in `src/app/auth/login/page.js` with local `/hero/login-hero.jpg`
- [x] Replace Unsplash URL in `src/app/auth/register/page.js` with local `/hero/register-hero.jpg`
- [x] Add `public/hero/README.md` with image specs (size, format, source links)
- [ ] **User action:** drop actual JPG files at the three paths above

### 1.4 Responsive pass
- [x] Static audit — no problematic hardcoded widths (tables use `min-w-[800px]+` inside `overflow-x-auto`, all card containers are fluid)
- [x] Removed unused legacy landing components (`QuickSearch.js`, `TrendingVenues.js`, `AnimatedCounter.js`, `LandingPage.jsx`) that still used old `bg-white`/`bg-slate-*` tokens
- [ ] **User QA:** click through each page at 375px (mobile) and 768px (tablet) in DevTools

### 1.5 Dark mode pass
- [x] Static audit — all surface tokens flip via `:root` / `.dark` CSS variables in `globals.css`
- [x] Removed legacy components still using non-tokenized whites/slates
- [ ] **User QA:** toggle `.dark` class on `<html>` (or use the theme toggle) and verify each page renders correctly

---

## Tier 2 — Resume-grade hero features (all four shipped)
- [x] Real-time slot updates via Server-Sent Events
    - New endpoint `GET /api/courts/[id]/availability/stream?date=YYYY-MM-DD` — `text/event-stream`, polls bookings + blocked-slots every 3s, emits diffs.
    - `TimeSlotPicker` subscribes via `EventSource`, shows a **Live / Sync… / Offline** indicator badge, flashes the badge when an update lands, and re-fetches REST availability.
- [x] Map view + geospatial search
    - New `/venues/map` page using `react-leaflet` + OpenStreetMap tiles (no API key).
    - Asks for browser geolocation, calls existing `/api/venues/nearby`, falls back to `/api/venues/search` if denied.
    - Custom emoji-per-sport markers, "recenter on me" button, radius selector, sport filter, fit-bounds on load.
    - Map View pill on `/venues` listing now links here.
- [x] AI-powered venue recommendations (content-based — no LLM needed)
    - New `GET /api/users/me/recommendations` — derives sport + city preferences from the user's last 20 bookings, scores candidates (sport overlap × 4 + city match × 3 + avg rating × 1), excludes already-booked facilities.
    - Cold-start fallback strategy returns top-rated venues for users with no history.
    - New `RecommendedForYou` rail mounted on the user dashboard, with "Matches your tennis bookings" / "In your city" reason chips.
    - Reuses existing `SimilarVenues` on venue detail pages (already wired pre-Tier-2 but verified end-to-end).
- [x] Match-making / group bookings (the headline feature)
    - Schema: added `Booking.isPublic`, `Booking.maxPlayers`, `Booking.skillLevel`, `Booking.matchNotes` + new `BookingParticipant` model + `ParticipantStatus` enum. **User must run `npx prisma migrate dev --name add_matchmaking` once.**
    - APIs:
        - `GET /api/matches` — public browse with sport/city/date filters (excludes full + past matches)
        - `POST /api/matches` — promotes a host's own booking to a public match
        - `POST /api/matches/[bookingId]/join` — auto-accept join
        - `DELETE /api/matches/[bookingId]/join` — leave match
    - UI: new `/matches` browse page with sport pills + city filter + capacity counters; "Looking for more players?" collapsible card on the booking confirmation page; navbar links ("Find a Match" / "Matches") for guests and signed-in users.

---

## Tier 3 — Engineering polish
- [x] **Vitest unit tests** — 26 passing across `src/__tests__/`: payment fees, refund tiers, order-id, slot overlap, facility/review/deactivation Zod schemas. Run with `npm test`.
- [x] **Automated API E2E suite** — 55 checks in `scripts/api-e2e-test.mjs` covering public + player + owner full CRUD + admin + RBAC + safe destructive deactivation. Run with `npm run test:e2e`.
- [x] **GitHub Actions CI** — `.github/workflows/ci.yml` runs lint + Vitest + `next build` on push/PR to main.
- [x] **Dockerfile + docker-compose.yml** — multi-stage prod build, non-root user, Postgres+app via `docker compose up --build`.
- [x] **Pino structured logger** — `src/lib/logger.js` with redaction of secrets; `LOG_LEVEL` env var.
- [x] **Sentry scaffold** — `src/lib/sentry.js` env-gated `captureError()`; activates when `SENTRY_DSN` is set + `@sentry/nextjs` is installed.
- [x] **README** — production-grade with Mermaid architecture diagram, env table, deployment guide.
- [x] **.env.example** — every required + optional var documented.
- [ ] Playwright browser E2E (Razorpay test-mode payment, SSE pulse, map interaction)
- [ ] PostHog / Plausible product analytics
- [ ] Migrate `<img>` → `next/image` (35 pre-existing warnings)
- [ ] Resolve `useEffect` exhaustive-deps warnings

---

## Tier 4 — Open items from earlier sessions
- [x] **`next build` clean** — verified, every route compiles, no errors.
- [x] **Automated route verification** — all 26 routes return HTTP 200; E2E suite green.
- [ ] Consolidate Prisma migration history (currently `db push`, would prefer a clean baseline migration)

---

## ✅ Verify Tier 1 work

Restart your dev server (`npm run dev`) before running these. All API changes need a server restart.

### 1. Hero images
- [ ] Drop three JPG files in `public/hero/` per `public/hero/README.md`:
  - `landing-hero.jpg` (1920×1080)
  - `login-hero.jpg` (1400×1600 portrait)
  - `register-hero.jpg` (1400×1600 portrait)
- [ ] Visit `/`, `/auth/login`, `/auth/register` — confirm your images render

### 2. Owner Court CRUD
- [ ] Log in as a facility owner
- [ ] Navigate to **Owner → Facilities** → click any facility row
- [ ] Verify the page background is cream (`bg-surface`) and tabs read **Courts · Photos · Details**
- [ ] Click **Add Court** → modal opens with sport-tile selector, name field, price field, description
- [ ] Submit → new court appears in the grid with sport icon + `font-mono` price
- [ ] Hover over a court card → click the pencil icon → edit form pre-fills correctly
- [ ] Save changes → row updates in place (was broken: "Court not found" — now fixed by new `/api/courts/[id]` PUT)
- [ ] Click the trash icon on a court → confirm delete → row disappears (now fixed by new `/api/courts/[id]` DELETE)

### 3. Owner Photo Upload — plain-English steps
- [ ] Open Chrome / Edge, log in as the facility owner.
- [ ] Click your avatar → **Owner Dashboard** → **Facilities** in the sidebar.
- [ ] Click any facility tile (you'll land on `/owner/facilities/<id>`).
- [ ] Near the top of the page you'll see three tab buttons: **Courts** · **Photos** · **Details**. Click **Photos**.
- [ ] Open a folder with a few facility photos. Drag a JPG/PNG file (under 5 MB) and drop it onto the dotted upload box on the page.
- [ ] The first photo you upload appears under the heading **"Cover Photo"**. Any extra uploads appear under **"Additional Photos"** with a small count badge.
- [ ] Hover the mouse over any uploaded photo — a red trash icon appears in the corner. Click it to delete that photo.
- [ ] Press **F5** (refresh the page). The photos should still be there. If they survive a refresh, the upload genuinely saved to the server.

### 4. Notification Preferences — plain-English steps
- [ ] Click your avatar → **My Profile** (or open `/dashboard/profile`).
- [ ] In the page, find the tab row near the top — click the **Notifications** tab.
- [ ] When the tab opens, you'll briefly see a "Loading…" flash, then 4 toggle switches load (email, SMS, promo emails, booking reminders).
- [ ] Click any switch (e.g. turn **Promotional Emails** ON).
- [ ] Scroll to the bottom of the tab → click the **Save Preferences** button.
- [ ] You should see a green success banner that says **"Notification preferences saved!"**.
- [ ] Press **F5** to refresh the page → click the **Notifications** tab again → your switch is still ON. That proves the API round-trip worked.

### 5. Account Deactivation
- [ ] Visit `/dashboard/profile` → click the **Security** tab → scroll to "Danger Zone"
- [ ] Click **Deactivate Account** → modal opens with reason textarea
- [ ] Click Confirm without typing → see "Please tell us why you are leaving"
- [ ] Type a reason → click Confirm → loading state → you should be logged out and redirected to `/`
- [ ] **Caution:** this actually deactivates the account. Test with a throwaway test account.

### 6. Owner Reviews — real histogram & responses
- [ ] Visit `/owner/reviews` as an owner with ≥2 reviews across multiple pages
- [ ] Verify the "Based on N reviews" matches the total across **all** pages (not just visible 10)
- [ ] Verify the 5-bar histogram percentages are computed across all reviews — paginate to page 2 and the bars should not change
- [ ] **Reply test**: click the **Reply** button on any review → type any text (even short like "Thanks!") → click **Submit** → response saves successfully (previously failed with "Validation failed" because the schema required 10+ chars and `venueId` was undefined; both now fixed)
- [ ] (Optional, dev-only) confirm `/api/owner/reviews?page=1` returns JSON with `ratingDistribution: { "1": …, "5": … }` and `averageRating: …`

### 7. Owner Earnings — real next-payout date
- [ ] Visit `/owner/earnings`
- [ ] The "Next Payout" hero card shows e.g. **"In 3 days (Mar 28)"** instead of the old hardcoded "Scheduled in 3 days"
- [ ] Hit `/api/owner/earnings?period=month` → response includes `summary.nextPayoutDate` as an ISO string

### 8. Owner Analytics — real heatmap
- [ ] Visit `/owner/analytics`
- [ ] Scroll to the **24h × 7d Peak Hours** heatmap
- [ ] If you have real bookings: cells reflect actual booking density per hour-of-day per day-of-week
- [ ] If no bookings: heatmap falls back to deterministic mock pattern (intentional)
- [ ] Hit `/api/owner/dashboard?period=month` → response includes `peakHoursByDay` as a 7×24 array

### 9. Lint sanity
```bash
npx eslint src/components/owner src/components/dashboard/ProfileContent.js src/app/api/owner
```
Expected: **0 errors**, ≤10 inherited warnings.

### 10. Static design audit
- Hard-refresh every page in DevTools mobile preset (375×667 iPhone SE)
- Toggle dark mode via DevTools "Rendering → emulate prefers-color-scheme: dark"
- Look for: text contrast issues, overflowing tables (should scroll), broken layouts

---

---

## ✅ Verify Tier 1 — second batch (helpful-vote, block slots, refund flow, nearby/cities/filters, admin refunds)

**Important:** restart the dev server (`npm run dev`) before testing. New API routes and validation changes require a fresh restart.

### 11. Helpful-vote on reviews — plain-English steps
- [ ] Open the site in your browser and **log in as a regular user** (not the venue owner).
- [ ] Click **Venues** in the top nav, then click on any venue tile that has at least one review.
- [ ] Scroll down to the **Reviews** section. Under each review's comment, you'll now see a small pill that says **"Helpful"** with a thumbs-up icon.
- [ ] Click the pill on someone else's review. It should immediately turn green (filled) and show **"Helpful 1"** (or increment by 1 if there were votes already).
- [ ] Click the pill again. The count drops back by 1 and the pill returns to grey — that means the un-vote works.
- [ ] Press **F5** to refresh the page. Your vote state survives the refresh, which proves the vote was saved on the server.
- [ ] If you try to click the pill on **your own** review, the pill is greyed out and disabled (you can't vote on your own review — that's intentional).
- [ ] If you click the pill while **logged out**, the page redirects you to the login screen.

### 12. Owner timeslot blocking — plain-English steps
- [ ] **Log in as a facility owner** (or any account that has the `FACILITY_OWNER` role).
- [ ] Click your avatar → **Owner Dashboard** → **Facilities** → click any facility tile.
- [ ] Near the top of the page you'll now see four tabs: **Courts · Photos · Blocked Slots · Details**. Click **Blocked Slots**.
- [ ] At the top right of the panel:
    - A **dropdown** lets you pick which court to manage (defaults to the first court).
    - A **"Block New Slot"** button reveals the block form.
- [ ] Click **Block New Slot**. A form appears with:
    - **Date** picker (defaults to today)
    - **Start Time** and **End Time** dropdowns (in `HH:00` 24-hour format)
    - A row of **Block Type** pills: Maintenance · Renovation · Event · Emergency · Other
    - **Reason** text input (must be at least 5 characters)
    - **"Force cancel existing bookings"** checkbox (use sparingly — it actually cancels any user bookings in that slot)
- [ ] Pick a date and time that has **no existing bookings**. Type a reason like "Floor resurfacing" and click **Block This Slot**.
- [ ] You should see a green banner saying **"Blocked 1 slot(s)."** and the new row appears in the **"Currently Blocked"** table below with the date, time range, and reason.
- [ ] **Now test the conflict guard:** create a booking from a regular user account on a future slot, then try to block that exact slot as the owner without checking "Force cancel". You'll see a red error: *"Existing bookings overlap this slot. 1 conflict(s)."* — the slot is NOT blocked, which is correct behavior.
- [ ] **Test the unblock flow:** in the "Currently Blocked" table, click **Unblock** on any row. Confirm the dialog → the row disappears.
- [ ] **Bonus check:** while a slot is blocked, log in as a regular user, go to that venue, and try to book that exact court for that date+time. The slot should be unavailable.

### 13. Refund flow on cancel — plain-English steps
- [ ] **Log in as a regular user** who has at least one **paid CONFIRMED booking** in the future. (If you don't have one, make a fresh booking and pay for it first via the normal flow.)
- [ ] Click your avatar → **My Bookings**.
- [ ] Find your paid booking and click the **Cancel** button on its card.
- [ ] A modal appears asking for a cancellation reason. Type any reason (e.g. "Plans changed") → click **Confirm Cancel**.
- [ ] After a brief loading spinner, the modal closes and a coloured banner appears at the top of the page. **What the banner says depends on how far in the future the booking is:**

    | Time until the booking | Banner colour & message |
    |---|---|
    | More than **24 hours** | Green: *"Refund initiated · ₹XXX (100%) will land in your account in 5-7 business days."* |
    | Between **12-24 hours** | Orange: *"Partial refund initiated · ₹XXX (50%) per our cancellation policy."* |
    | Less than **12 hours** | Grey: *"Booking cancelled — no refund"* (with the policy text) |
    | Refund call failed | Red: *"Refund couldn't be initiated automatically. Contact support."* |

- [ ] Verify the banner has an **X button** in the top-right — clicking it dismisses the banner.
- [ ] Verify the booking card itself now shows status **CANCELLED**.
- [ ] **Server-side check (dev tools):** open the browser DevTools → Network tab → trigger another cancel. You should see two requests fire in sequence: first `POST /api/bookings/<id>/cancel` (200), then `POST /api/payments/refund` (201 if refund > 0, skipped if 0%).
- [ ] **Caution**: this actually creates a refund record in your DB and triggers Razorpay's test refund. Use throwaway bookings.

### 14. Home page — city autocomplete + "Use my location"
- [ ] Open `/` (the landing page). Look at the search bar in the hero section.
- [ ] Click into the **Location** input field and start typing — you should see a native browser dropdown suggesting cities like *Mumbai, Delhi, Bangalore* (the real cities from your DB, fetched via `/api/venues/cities`).
- [ ] To the right of the Location field, you'll see a small round **target/crosshair icon** (`my_location`). Click it.
- [ ] Your browser will pop up a prompt: *"Allow this site to know your location?"* — click **Allow**.
- [ ] The icon spins for a moment, then automatically:
    - Fills the Location field with the nearest city to you (e.g. *"Mumbai"*).
    - Redirects you to `/venues?city=Mumbai` showing venues in that city.
- [ ] **Test the rejection path:** clear cookies / open in incognito → click the icon → choose **Block** when prompted. A red error banner appears under the search bar: *"Location permission denied. Type your city instead."*

### 15. Venues page — dynamic filters
- [ ] Open `/venues` (the listings page).
- [ ] Open the **Filters** sidebar (left on desktop, or via the mobile filter button).
- [ ] **Cities dropdown**: open it — instead of always showing the same 6 hardcoded cities, you now see the actual cities from your database. Add a brand-new city via a facility row in Prisma Studio → reload the page → that new city appears in the dropdown.
- [ ] **Sports list**: the sport chips reflect only sports that **actually exist** in your courts table. If you have no Volleyball courts, the Volleyball chip won't appear.
- [ ] **Amenities list**: same — only amenities tied to at least one approved facility appear.
- [ ] **Sanity check**: pick any new filter, click a sport, click apply — the URL updates with the chosen filters and the venue list re-fetches with those query params.

### 16. Admin revenue — refunds card
- [ ] **Log in as an admin** and visit `/admin/revenue`.
- [ ] Scroll to the **"Refunds Overview"** card on the right side.
- [ ] **If your database has at least one completed refund** (you can create one by doing test #13 above), the card now shows real numbers:
    - **Total Refunds**: count of refunds in this period (was always 0 before)
    - **Refund Amount**: total ₹ refunded
    - **Refund Rate**: refund amount / total revenue, as a %
    - **Avg. Refund**: refund amount / count
- [ ] **API-level check:** hit `/api/admin/revenue?period=month` directly (logged in as admin) and confirm the response has `data.analytics.overview.refundCount` and `data.analytics.overview.totalRefunds`. Previously `refundCount` was missing entirely.

---

---

## ✅ Verify Tier 2 — hero features (real-time, map, AI recs, match-making)

**Before testing:**

1. **Run the database migration for match-making** (only once):
    ```bash
    npx prisma migrate dev --name add_matchmaking
    npx prisma generate
    ```
    This creates the `booking_participants` table and adds `isPublic`, `maxPlayers`, `skillLevel`, `matchNotes` columns to the bookings table. Without this step the `/matches` and "Open to others" features will throw runtime errors.

2. **Restart the dev server** (`npm run dev`). New API routes and the new `react-leaflet` import won't pick up otherwise.

3. **Make sure at least 2-3 of your test facilities have `latitude` and `longitude` set** — open Prisma Studio (`npx prisma studio`), click the `Facility` table, and fill in coordinates for a few rows. Without lat/lng the map will be empty.

---

### 17. Real-time slot updates — plain-English steps

- [ ] Log in as any user (the booking flow needs auth).
- [ ] Open two browser windows side-by-side. In **Window A**, navigate to any venue → click **Book Now** on a court → pick a future date.
- [ ] In **Window B**, do the same: same venue, same court, same date. Both windows now show the same time-slot grid.
- [ ] Look in the top-right of the slot picker. You'll see a small pill with a green dot that says **"Live"**. Hover it — the tooltip says *"Live availability stream active"*. (If it says "Sync…" for more than a few seconds, your network is slow but it will reconnect.)
- [ ] **In Window A only**, click an available slot and complete a booking through to confirmation (pay the test ₹0 amount with Razorpay test cards).
- [ ] **Watch Window B** without refreshing it. Within ~3 seconds, the "Live" badge pulses with a yellow ring, and the slot you just booked in Window A flips from green ("Available") to grey ("Booked") **automatically — no page reload**.
- [ ] Open DevTools → Network tab → filter "stream" → you'll see one EventSource connection per tab, with rows like `event: snapshot`, then alternating `event: ping` (every 3s when nothing changed) and `event: update` (only when something changed).
- [ ] **Negative test**: kill your internet connection briefly. The pill turns grey and reads **"Offline"**. Re-enable internet — within seconds the pill flips back to green **"Live"** (EventSource auto-reconnects).

### 18. Map view — plain-English steps

- [ ] Visit `/venues` and click the **Map View** pill in the top-right of the page header. You'll land on `/venues/map`.
- [ ] The browser pops up a permission prompt: *"Allow this site to access your location?"*. Click **Allow**.
- [ ] After a second, the map zooms to your area. You'll see:
    - A **blue dot** marking your location.
    - Several **white circular pins** with a sport emoji (🏸, 🎾, etc.) — one per nearby venue.
    - A filter bar in the top-left with a **sport dropdown** and a **radius dropdown** (5 / 10 / 25 / 50 km).
    - A small **target icon** in the top-right — click it to re-centre on your location after panning.
- [ ] Click any pin. A popup appears showing: the venue name, city, distance ("📍 2.3km away"), top 3 sports, price range, and a **"View venue →"** link that takes you to `/venues/[id]`.
- [ ] Change the sport filter to **🏸 Badminton**. The pins refresh — only venues with at least one active Badminton court remain visible.
- [ ] Change the radius to **5 km** — the pin set shrinks. Change it to **50 km** — more pins reappear.
- [ ] **Reject path**: open the page in an incognito window → choose **Block** at the geolocation prompt. The map still loads, centred on India, showing all approved venues with coordinates. The radius selector hides (only meaningful when we know where you are).

### 19. AI venue recommendations — plain-English steps

- [ ] Log in as a regular user account.
- [ ] **If this is a fresh account** (no bookings yet): visit `/dashboard`. Scroll all the way down, past Quick Actions / Recent Activity / Favorites — you'll see a horizontal carousel labelled **"Popular right now"** with the subtitle *"Top-rated venues you might enjoy"*. This is the **cold-start** strategy.
- [ ] Now make at least 2 bookings (say, 1 Badminton in Mumbai and 1 Tennis in Mumbai) → wait for them to confirm.
- [ ] Refresh `/dashboard` and scroll back down. The same carousel section now reads **"Recommended for you"** with the subtitle *"Based on N recent bookings · favorites: badminton, tennis"*.
- [ ] Each card now has a small reason chip:
    - **"Matches your badminton bookings"** if the venue has badminton courts
    - **"In your city"** if the venue is in Mumbai but a different sport
- [ ] The venues you already booked are **excluded** from the rail — scroll the rail and confirm you don't see them.
- [ ] **API-level check (dev tools)**: open `/api/users/me/recommendations` directly. The response includes `data.strategy` (either `preference-based` or `cold-start-popular`), `data.profile.topSports`, `data.profile.topCities`, and `data.recommendations` (array with `reasons.sharedSports` + `reasons.sameCity` per item).
- [ ] **Bonus**: visit any venue detail page → scroll to the very bottom → the existing **"Similar Venues"** section also works end-to-end (it was the original content-based recommender, scoring by sport overlap × 3 + amenity overlap × 2 + rating).

### 20. Match-making — plain-English steps

**Set-up reminder:** you must have run `npx prisma migrate dev --name add_matchmaking` first or the `/matches` page and "Open to Others" card will 500.

**Part A — open a match (as a host):**

- [ ] Log in as **User A**. Make a normal booking → pay → land on the confirmation page (`/booking/confirmation/[id]`).
- [ ] Scroll past the QR code and action buttons. You'll see a card titled **"Looking for more players?"** with a Groups icon.
- [ ] Click it to expand. A form appears with:
    - **How many players total?** (default 4, allowed 2–20)
    - **Skill level** chips: Any level / Beginner / Intermediate / Advanced
    - **Note for joiners** (optional textarea, 500-char cap)
- [ ] Set 4 players, pick Intermediate, type a note like "Bring your own racket." → click **Open to other players**.
- [ ] The card collapses and turns green: **"Match opened — others can join you!"** with a "View matches" button.
- [ ] Click **View matches** → you land on `/matches` and see your own match listed with **"You're hosting"** in place of the join button.

**Part B — join a match (as a different user):**

- [ ] Log out → log in as **User B** (different account).
- [ ] Click **Matches** in the top navbar (or **Find a Match** if you log out). The browse page loads.
- [ ] You'll see User A's match card showing:
    - Sport emoji + sport name + court name + facility/city
    - Date + time range (formatted nicely)
    - Skill-level pill colour-coded (red=advanced, orange=intermediate, blue=beginner/any)
    - Italic note text inside a left border
    - Host avatar (User A's initial) plus a capacity counter like **"1/4 · 3 seats open"**
    - A green **"Join match"** button on the right
- [ ] Filter by **🏸 Badminton** (or whichever sport you booked) — only matching matches stay. Type "Mumbai" in the city box → filters by city too.
- [ ] Click **Join match**. The button briefly shows "Joining…" then the card refreshes — User B's avatar is added to the row of avatars, the counter goes to **2/4 · 2 seats open**, and the button changes to **"Leave match"**.
- [ ] Click **Leave match** → counter goes back to 1/4 and the button returns to "Join match".

**Part C — guards & edge cases:**

- [ ] **As User A (host)**, try to click "Join match" on your own card — you can't. The right side just shows "You're hosting".
- [ ] **Log out** and try to join a match — the button is replaced with **"Log in to join"** linking to `/auth/login`.
- [ ] **Fill the match up**: have 3 other users join. The 4th joiner sees the button disabled with text **"Full"**, and the API returns a 409 *"This match is full"*.
- [ ] **API-level checks**:
    - `GET /api/matches` returns only public, future, non-full bookings.
    - `POST /api/matches` requires the caller to BE the booking host (try with a different user's bookingId → 403).
    - The body validation rejects `maxPlayers < 2` or `> 20` and rejects unknown `skillLevel` strings.

---

---

## ✅ Final-stage verification (run these to confirm production-readiness)

Everything below can be run as-is. Each step prints **PASS** / **FAIL** clearly.

### F1. Unit tests
```powershell
npm test
```
Expected: **`Test Files 3 passed (3) · Tests 26 passed (26)`**. Covers Razorpay fee math (UPI/Card/EMI), refund tiers, slot-overlap math (no double-booking), and key Zod schemas.

### F2. End-to-end API suite
With the dev server running (`npm run dev`):
```powershell
npm run test:e2e
```
Expected: **`53–55 passed, 0 failed`** (1–2 helpful-vote checks may skip if no eligible review exists — that's fine). Covers:
- All public reads (home, search, cities, filters, nearby, sports, amenities, matches, venue detail, reviews, similar)
- Player: profile, dashboard, recommendations, helpful vote, match-creation validation
- **Owner full CRUD lifecycle**: create facility → view own PENDING → update → create court → update court → block slots → unblock → delete court → delete facility
- Admin: all admin reads + RBAC (player blocked → 403)
- **Account deactivation**: throwaway user, wrong-password 401, correct-password 200, DB `isActive=false` verified, cleanup

### F3. Production build (deploy gate)
```powershell
npm run build
```
Expected: builds with zero errors. Every route appears in the route table (○ static or ƒ dynamic). If this passes, the app is deployable.

### F4. CI workflow (when you push to GitHub)
Push to a branch + open a PR to `main`. The CI workflow at `.github/workflows/ci.yml` runs lint → unit tests → production build. The green checkmark on the PR proves nothing regressed.

### F5. Docker (full stack from scratch)
```powershell
docker compose up --build
```
Expected: brings up Postgres → app on `http://localhost:3000`. Runs `prisma db push` on first boot. Useful as a clean-room reproduction of a production deploy.

### F6. Lint
```powershell
npm run lint
```
Expected: passes (or warnings only — 35 pre-existing `<img>` and exhaustive-deps warnings are tracked in the roadmap, not blockers).

### F7. Logger smoke test
Hit any API route while the dev server runs and you'll see structured JSON logs. To bump verbosity:
```powershell
$env:LOG_LEVEL = "debug"; npm run dev
```
Secrets (`password`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_API_SECRET`, `SMTP_PASS`) are redacted automatically by Pino.

### F8. Sentry (when you want it)
1. `npm i @sentry/nextjs`
2. Add `SENTRY_DSN=...` to `.env`
3. Restart. Any `captureError(err)` call now reports to Sentry. With no DSN, it's a no-op — dev never depends on it.

### F9. Cloudinary smoke test (after adding env vars)
1. Add `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` to `.env`, restart.
2. Log in, go to **Profile → Change photo**, upload an image.
3. Look at the avatar URL in DevTools — it should start with `https://res.cloudinary.com/`. Without the env vars, it falls back to `/uploads/avatars/...` on local disk (still works).

### F10. Two recently-fixed bugs to confirm in the browser
- **Add facility with blank lat/lng** — `/owner/facilities/new` → fill required fields, leave lat & lng empty → Submit → should succeed (previously 500'd because `coordinateSchema` rejected `null`).
- **Edit a facility, then re-open it** — go to a facility → pencil → edit anything → Save → click the pencil again on the same row. It should load the form (previously 404'd because GET `/api/venues/[id]` only allowed APPROVED status; now owners see their own PENDING/REJECTED facilities too).

---

## Known caveats (not blockers)
- 7 pre-existing lint errors in `ConfirmDialog.js`, `NotificationBell.js`, `PushNotificationContext.js`, `ThemeContext.js` — inherited from before this redesign, out of Tier 1 scope
- Pre-existing prerender error from `/dashboard/reviews` was fixed by the AuthGuard import correction
- Mobile + dark mode haven't been manually QA'd — needs human eyes (Tier 1.4/1.5 user-action items above)
