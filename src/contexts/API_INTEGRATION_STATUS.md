# API Integration Status

This file tracks the integration status of all backend APIs into the frontend.
Use `useApi()` hook from `@/contexts/ApiContext` to access these methods.

---

## Legend
- [x] Integrated in frontend
- [ ] API exists, needs frontend integration

---

## 1. Venue APIs (`useApi().venue`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getVenues()` | `GET /api/venues` | List venues with filters |
| [x] | `getVenue(id)` | `GET /api/venues/[id]` | Get single venue |
| [x] | `createVenue(data)` | `POST /api/venues` | Create venue (owner) |
| [ ] | `updateVenue(id, data)` | `PUT /api/venues/[id]` | Update venue details |
| [x] | `deleteVenue(id)` | `DELETE /api/venues/[id]` | Delete venue |
| [ ] | `getNearbyVenues(lat, lng, radius)` | `GET /api/venues/nearby` | Find nearby venues |
| [x] | `getSuggestions(query)` | `GET /api/venues/suggestions` | Autocomplete |
| [ ] | `getCities()` | `GET /api/venues/cities` | Get featured cities |
| [ ] | `getFilters()` | `GET /api/venues/filters` | Get filter options |
| [x] | `getTrending(limit)` | `GET /api/venues/trending` | Get trending venues |
| [ ] | `searchAvailable(data)` | `POST /api/venues/search/available` | Search with availability |
| [x] | `getSimilar(id, limit)` | `GET /api/venues/[id]/similar` | Get similar venues |
| [ ] | `getRating(id)` | `GET /api/venues/[id]/rating` | Get rating stats |

**Priority:** High - These enhance discovery features

---

## 2. Court APIs (`useApi().court`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getCourts(venueId)` | `GET /api/venues/[id]/courts` | Get venue courts |
| [ ] | `createCourt(venueId, data)` | `POST /api/venues/[id]/courts` | Add court (owner) |
| [ ] | `updateCourt(courtId, data)` | `PUT /api/courts/[id]` | Update court |
| [ ] | `deleteCourt(courtId)` | `DELETE /api/courts/[id]` | Delete court |
| [x] | `getAvailability(courtId, date)` | `GET /api/courts/[id]/availability` | Check availability |
| [ ] | `getTimeslots(venueId, courtId, date)` | `GET /api/venues/[id]/courts/[courtId]/timeslots` | Get time slots |
| [ ] | `createTimeslots(venueId, courtId, data)` | `POST /api/venues/[id]/courts/[courtId]/timeslots` | Create slots (owner) |
| [ ] | `deleteTimeslot(venueId, courtId, slotId)` | `DELETE /api/venues/[id]/courts/[courtId]/timeslots` | Delete slot |
| [ ] | `getBlockedSlots(courtId, startDate, endDate)` | `GET /api/courts/[id]/block-slots` | Get blocked slots |
| [ ] | `blockSlots(courtId, data)` | `POST /api/courts/[id]/block-slots` | Block slots (owner) |
| [ ] | `unblockSlots(courtId, data)` | `DELETE /api/courts/[id]/block-slots` | Unblock slots |

**Priority:** High - Owner panel needs these for court management

---

## 3. Review APIs (`useApi().review`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getReviews(venueId, params)` | `GET /api/venues/[id]/reviews` | Get reviews |
| [ ] | `getReview(venueId, reviewId)` | `GET /api/venues/[id]/reviews/[reviewId]` | Get single review |
| [x] | `createReview(venueId, data)` | `POST /api/venues/[id]/reviews` | Create review |
| [x] | `updateReview(venueId, reviewId, data)` | `PUT /api/venues/[id]/reviews/[reviewId]` | Update review |
| [x] | `deleteReview(venueId, reviewId)` | `DELETE /api/venues/[id]/reviews/[reviewId]` | Delete review |
| [ ] | `flagReview(venueId, reviewId, reason)` | `POST /api/venues/[id]/reviews/[reviewId]/flag` | Flag as inappropriate |
| [ ] | `markHelpful(venueId, reviewId)` | `POST /api/venues/[id]/reviews/[reviewId]/helpful` | Mark helpful |
| [ ] | `removeHelpful(venueId, reviewId)` | `DELETE /api/venues/[id]/reviews/[reviewId]/helpful` | Remove helpful vote |
| [x] | `addResponse(venueId, reviewId, response)` | `POST /api/venues/[id]/reviews/[reviewId]/response` | Owner response |
| [x] | `updateResponse(venueId, reviewId, response)` | `PUT /api/venues/[id]/reviews/[reviewId]/response` | Update response |
| [x] | `deleteResponse(venueId, reviewId)` | `DELETE /api/venues/[id]/reviews/[reviewId]/response` | Delete response |

**Priority:** Medium - Enhances review experience

---

## 4. Booking APIs (`useApi().booking`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getBookings(params)` | `GET /api/bookings` | Get user bookings |
| [ ] | `getBooking(id)` | `GET /api/bookings/[id]` | Get single booking |
| [x] | `createBooking(data)` | `POST /api/bookings` | Create booking |
| [ ] | `updateBooking(id, data)` | `PUT /api/bookings/[id]` | Update booking |
| [x] | `cancelBooking(id, reason)` | `PUT /api/bookings/[id]` | Cancel booking |
| [ ] | `getPaymentStatus(id)` | `GET /api/bookings/[id]/payment-status` | Check payment |
| [x] | `initiatePayment(id)` | `POST /api/bookings/[id]/pay` | Start payment |
| [ ] | `getReceipt(id)` | `GET /api/bookings/[id]/receipt` | Download receipt |

**Priority:** Medium - Receipt & payment status useful

---

## 5. Payment APIs (`useApi().payment`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [ ] | `getPayment(id)` | `GET /api/payments/[id]` | Get payment details |
| [x] | `verifyPayment(data)` | `POST /api/payments/verify` | Verify payment |
| [ ] | `getMethods()` | `GET /api/payments/methods` | Get payment methods |
| [ ] | `requestRefund(data)` | `POST /api/payments/refund` | Request refund |
| [ ] | `getRefundStatus(paymentId)` | `GET /api/payments/refund` | Check refund status |

**Priority:** Medium - Refund flow needed

---

## 6. User APIs (`useApi().user`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getProfile()` | `GET /api/users/profile` | Get profile |
| [x] | `updateProfile(data)` | `PUT /api/users/profile` | Update profile |
| [x] | `changePassword(data)` | `PUT /api/users/password` | Change password |
| [ ] | `getAccount()` | `GET /api/users/account` | Get account status |
| [ ] | `deactivateAccount(reason)` | `DELETE /api/users/account` | Deactivate account |
| [x] | `getDashboard(period)` | `GET /api/users/dashboard` | Dashboard data |
| [x] | `getMyReviews(params)` | `GET /api/users/me/reviews` | User's reviews |
| [x] | `getPaymentHistory(params)` | `GET /api/users/me/payments` | Payment history |

**Priority:** High - Account management & history needed

---

## 7. Notification APIs (`useApi().notification`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getNotifications(params)` | `GET /api/notifications` | Get notifications |
| [ ] | `getNotification(id)` | `GET /api/notifications/[id]` | Get single notification |
| [x] | `markAsRead(id)` | `PUT /api/notifications/[id]` | Mark as read |
| [x] | `markAllAsRead()` | `PUT /api/notifications` | Mark all read |
| [ ] | `deleteNotification(id)` | `DELETE /api/notifications/[id]` | Delete notification |
| [x] | `deleteAllRead()` | `DELETE /api/notifications` | Delete all read |
| [ ] | `getPreferences()` | `GET /api/notifications/preferences` | Get preferences |
| [ ] | `updatePreferences(data)` | `PUT /api/notifications/preferences` | Update preferences |
| [ ] | `getUnreadCount()` | `GET /api/notifications/count` | Unread count |

**Priority:** Medium - Preferences page needed

---

## 8. Misc APIs (`useApi().misc`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [ ] | `getHomeData()` | `GET /api/home` | Home page data |
| [ ] | `getAmenities()` | `GET /api/amenities` | All amenities |
| [ ] | `getSports()` | `GET /api/sports` | All sports |
| [ ] | `getPopularSports()` | `GET /api/sports/popular` | Popular sports |
| [ ] | `submitReport(data)` | `POST /api/reports` | Submit report |
| [ ] | `getReports()` | `GET /api/reports` | User's reports |
| [ ] | `applyCoupon(code, data)` | `POST /api/coupons/apply` | Apply coupon |

**Priority:** Medium - Home page & reports

---

## 9. Upload APIs (`useApi().upload`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [ ] | `uploadFacilityPhotos(venueId, formData)` | `POST /api/upload/facility-photos` | Upload photos |
| [ ] | `getFacilityPhotos(venueId)` | `GET /api/upload/facility-photos` | Get photos |
| [ ] | `deleteFacilityPhoto(photoId)` | `DELETE /api/upload/facility-photos/[id]` | Delete photo |

**Priority:** High - Owner needs photo management

---

## 10. Owner APIs (`useApi().owner`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getDashboard(period)` | `GET /api/owner/dashboard` | Owner dashboard |
| [x] | `getReviews(params)` | `GET /api/owner/reviews` | Venue reviews |
| [x] | `getEarnings(params)` | `GET /api/owner/earnings` | Earnings summary |
| [x] | `getFacilities()` | `GET /api/owner/facilities` | Owner's facilities |
| [x] | `getBookings(params)` | `GET /api/owner/bookings` | Facility bookings |

**Priority:** High - Complete owner panel

---

## 11. Admin APIs (`useApi().admin`)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| [x] | `getAnalytics(period)` | `GET /api/admin/analytics` | Dashboard analytics |
| [ ] | `getSearchAnalytics(params)` | `GET /api/admin/analytics/search` | Search analytics |
| [x] | `getRevenue(params)` | `GET /api/admin/revenue` | Revenue data |
| [x] | `getUsers(params)` | `GET /api/admin/users` | List users |
| [ ] | `getUser(id)` | `GET /api/admin/users/[id]` | User details |
| [x] | `updateUser(id, data)` | `PUT /api/admin/users/[id]` | Update user |
| [ ] | `deleteUser(id)` | `DELETE /api/admin/users/[id]` | Delete user |
| [ ] | `changeUserRole(id, role)` | `PUT /api/admin/users/[id]/role` | Change role |
| [ ] | `getVenues(params)` | `GET /api/admin/venues` | List all venues |
| [ ] | `getVenue(id)` | `GET /api/admin/venues/[id]` | Venue details |
| [x] | `getApprovals(params)` | `GET /api/admin/approvals` | Pending approvals |
| [x] | `processApproval(id, action, reason)` | `POST /api/admin/approvals` | Approve/reject |
| [x] | `getBookings(params)` | `GET /api/admin/bookings` | All bookings |
| [ ] | `getBooking(id)` | `GET /api/admin/bookings/[id]` | Booking details |
| [ ] | `updateBooking(id, data)` | `PUT /api/admin/bookings/[id]` | Update booking |
| [ ] | `cancelBooking(id, reason)` | `DELETE /api/admin/bookings/[id]` | Cancel booking |
| [ ] | `getCourts(params)` | `GET /api/admin/courts` | All courts |
| [ ] | `bulkUpdateCourts(data)` | `POST /api/admin/courts` | Bulk update |
| [ ] | `getReviews(params)` | `GET /api/admin/reviews` | All reviews |
| [ ] | `getReview(id)` | `GET /api/admin/reviews/[id]` | Review details |
| [ ] | `moderateReview(id, action, reason)` | `PUT /api/admin/reviews/[id]` | Moderate review |
| [ ] | `deleteReview(id)` | `DELETE /api/admin/reviews/[id]` | Delete review |
| [ ] | `getPayments(params)` | `GET /api/admin/payments` | All payments |
| [ ] | `getPayment(id)` | `GET /api/admin/payments/[id]` | Payment details |
| [ ] | `updatePayment(id, data)` | `PUT /api/admin/payments/[id]` | Update payment |
| [ ] | `getRefunds(params)` | `GET /api/admin/refunds` | All refunds |
| [ ] | `processRefund(data)` | `POST /api/admin/refunds` | Process refund |
| [ ] | `getNotifications()` | `GET /api/admin/notifications` | Get notifications |
| [ ] | `sendNotification(data)` | `POST /api/admin/notifications` | Send notification |
| [x] | `getModerationQueue(params)` | `GET /api/admin/moderation` | Moderation queue |
| [ ] | `getModerationItem(id)` | `GET /api/admin/moderation/[id]` | Item details |
| [x] | `moderateItem(id, action, reason)` | `PUT /api/admin/moderation/[id]` | Take action |

**Priority:** Medium - Expand admin capabilities

---

## Summary

| Category | Total | Integrated | Remaining |
|----------|-------|------------|-----------|
| Venue | 13 | 7 | 6 |
| Court | 11 | 2 | 9 |
| Review | 11 | 8 | 3 |
| Booking | 8 | 4 | 4 |
| Payment | 5 | 1 | 4 |
| User | 8 | 6 | 2 |
| Notification | 9 | 4 | 5 |
| Misc | 7 | 0 | 7 |
| Upload | 3 | 0 | 3 |
| Owner | 5 | 5 | 0 |
| Admin | 32 | 9 | 23 |
| **Total** | **112** | **46** | **66** |

---

## Integration Priorities

### High Priority (Done)
1. ~~**Owner Panel** - Earnings, reviews~~ COMPLETED
2. ~~**User Account** - Payment history, reviews~~ COMPLETED
3. ~~**Venue Discovery** - Trending, similar venues~~ COMPLETED

### Next Up
4. **Court Management** - Timeslots, block slots (owner panel)
5. **Venue Discovery** - Nearby venues, cities, filters
6. **Review Features** - Helpful votes, flagging

### Lower Priority
7. **Admin Expansion** - Additional admin features
8. **Home Page** - Dynamic home data, popular sports

---

## Usage Example

```jsx
import { useApi } from '@/contexts';

function MyComponent() {
  const { venue, booking, user } = useApi();

  // Fetch trending venues
  const loadTrending = async () => {
    const { success, data, error } = await venue.getTrending(10);
    if (success) {
      setVenues(data.venues);
    }
  };

  // Get payment history
  const loadPayments = async () => {
    const { success, data } = await user.getPaymentHistory({ page: 1 });
    if (success) {
      setPayments(data.payments);
    }
  };
}
```

---

*Last updated: 2026-03-20*
