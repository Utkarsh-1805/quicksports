'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';

const ApiContext = createContext(null);

const TOKEN_KEY = 'quickcourt_token';

/**
 * API Context Provider
 * Centralizes all API calls for the application
 */
export function ApiProvider({ children }) {

  // Get auth token
  const getToken = useCallback(() => {
    return Cookies.get(TOKEN_KEY);
  }, []);

  // Base fetch wrapper with auth and error handling
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Handle FormData (file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || data.error || 'Request failed',
          errors: data.errors,
          data
        };
      }

      return { success: true, data: data.data || data, response };
    } catch (error) {
      if (error.status) {
        return { success: false, error: error.message, errors: error.errors, status: error.status };
      }
      return { success: false, error: error.message || 'Network error' };
    }
  }, [getToken]);

  // ==========================================
  // VENUE APIs
  // ==========================================
  const venueApi = useMemo(() => ({
    // Get all venues with filters
    getVenues: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/venues${query ? `?${query}` : ''}`);
    },

    // Get single venue
    getVenue: (id) => apiFetch(`/api/venues/${id}`),

    // Create venue (owner)
    createVenue: (data) => apiFetch('/api/venues', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Update venue (owner)
    updateVenue: (id, data) => apiFetch(`/api/venues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Delete venue
    deleteVenue: (id) => apiFetch(`/api/venues/${id}`, { method: 'DELETE' }),

    // Get nearby venues
    getNearbyVenues: (lat, lng, radius = 10) =>
      apiFetch(`/api/venues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),

    // Get venue suggestions (autocomplete)
    getSuggestions: (query) => apiFetch(`/api/venues/suggestions?q=${encodeURIComponent(query)}`),

    // Get featured cities
    getCities: () => apiFetch('/api/venues/cities'),

    // Get filter options
    getFilters: () => apiFetch('/api/venues/filters'),

    // Get trending venues
    getTrending: (limit = 10) => apiFetch(`/api/venues/trending?limit=${limit}`),

    // Search with availability
    searchAvailable: (data) => apiFetch('/api/venues/search/available', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Get similar venues
    getSimilar: (id, limit = 5) => apiFetch(`/api/venues/${id}/similar?limit=${limit}`),

    // Get venue rating stats
    getRating: (id) => apiFetch(`/api/venues/${id}/rating`),
  }), [apiFetch]);

  // ==========================================
  // COURT APIs
  // ==========================================
  const courtApi = useMemo(() => ({
    // Get courts for venue
    getCourts: (venueId) => apiFetch(`/api/venues/${venueId}/courts`),

    // Create court (owner)
    createCourt: (venueId, data) => apiFetch(`/api/venues/${venueId}/courts`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Update court
    updateCourt: (courtId, data) => apiFetch(`/api/courts/${courtId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Delete court
    deleteCourt: (courtId) => apiFetch(`/api/courts/${courtId}`, { method: 'DELETE' }),

    // Get court availability
    getAvailability: (courtId, date) =>
      apiFetch(`/api/courts/${courtId}/availability${date ? `?date=${date}` : ''}`),

    // Get time slots
    getTimeslots: (venueId, courtId, date) =>
      apiFetch(`/api/venues/${venueId}/courts/${courtId}/timeslots${date ? `?date=${date}` : ''}`),

    // Create time slots (owner)
    createTimeslots: (venueId, courtId, data) =>
      apiFetch(`/api/venues/${venueId}/courts/${courtId}/timeslots`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    // Delete time slot
    deleteTimeslot: (venueId, courtId, slotId) =>
      apiFetch(`/api/venues/${venueId}/courts/${courtId}/timeslots?slotId=${slotId}`, {
        method: 'DELETE'
      }),

    // Get blocked slots
    getBlockedSlots: (courtId, startDate, endDate) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return apiFetch(`/api/courts/${courtId}/block-slots?${params}`);
    },

    // Block time slots (owner)
    blockSlots: (courtId, data) => apiFetch(`/api/courts/${courtId}/block-slots`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Unblock time slots
    unblockSlots: (courtId, data) => apiFetch(`/api/courts/${courtId}/block-slots`, {
      method: 'DELETE',
      body: JSON.stringify(data)
    }),
  }), [apiFetch]);

  // ==========================================
  // REVIEW APIs
  // ==========================================
  const reviewApi = useMemo(() => ({
    // Get venue reviews
    getReviews: (venueId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/venues/${venueId}/reviews${query ? `?${query}` : ''}`);
    },

    // Get single review
    getReview: (venueId, reviewId) => apiFetch(`/api/venues/${venueId}/reviews/${reviewId}`),

    // Create review
    createReview: (venueId, data) => apiFetch(`/api/venues/${venueId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Update review
    updateReview: (venueId, reviewId, data) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    // Delete review
    deleteReview: (venueId, reviewId) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}`, { method: 'DELETE' }),

    // Flag review as inappropriate
    flagReview: (venueId, reviewId, reason) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),

    // Mark review as helpful
    markHelpful: (venueId, reviewId) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/helpful`, { method: 'POST' }),

    // Remove helpful vote
    removeHelpful: (venueId, reviewId) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/helpful`, { method: 'DELETE' }),

    // Add owner response
    addResponse: (venueId, reviewId, response) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/response`, {
        method: 'POST',
        body: JSON.stringify({ response })
      }),

    // Update owner response
    updateResponse: (venueId, reviewId, response) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/response`, {
        method: 'PUT',
        body: JSON.stringify({ response })
      }),

    // Delete owner response
    deleteResponse: (venueId, reviewId) =>
      apiFetch(`/api/venues/${venueId}/reviews/${reviewId}/response`, { method: 'DELETE' }),
  }), [apiFetch]);

  // ==========================================
  // BOOKING APIs
  // ==========================================
  const bookingApi = useMemo(() => ({
    // Get user bookings
    getBookings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/bookings${query ? `?${query}` : ''}`);
    },

    // Get single booking
    getBooking: (id) => apiFetch(`/api/bookings/${id}`),

    // Create booking
    createBooking: (data) => apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Update booking
    updateBooking: (id, data) => apiFetch(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Cancel booking
    cancelBooking: (id, reason) => apiFetch(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CANCELLED', cancellationReason: reason })
    }),

    // Get payment status
    getPaymentStatus: (id) => apiFetch(`/api/bookings/${id}/payment-status`),

    // Initiate payment
    initiatePayment: (id) => apiFetch(`/api/bookings/${id}/pay`, { method: 'POST' }),

    // Get receipt
    getReceipt: (id) => apiFetch(`/api/bookings/${id}/receipt`),
  }), [apiFetch]);

  // ==========================================
  // PAYMENT APIs
  // ==========================================
  const paymentApi = useMemo(() => ({
    // Get payment details
    getPayment: (id) => apiFetch(`/api/payments/${id}`),

    // Verify payment
    verifyPayment: (data) => apiFetch('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Get payment methods
    getMethods: () => apiFetch('/api/payments/methods'),

    // Request refund
    requestRefund: (data) => apiFetch('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Get refund status
    getRefundStatus: (paymentId) => apiFetch(`/api/payments/refund?paymentId=${paymentId}`),
  }), [apiFetch]);

  // ==========================================
  // USER APIs
  // ==========================================
  const userApi = useMemo(() => ({
    // Get profile
    getProfile: () => apiFetch('/api/users/profile'),

    // Update profile
    updateProfile: (data) => apiFetch('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Change password
    changePassword: (data) => apiFetch('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Get account status
    getAccount: () => apiFetch('/api/users/account'),

    // Deactivate account
    deactivateAccount: (reason, password) => apiFetch('/api/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ reason, password })
    }),

    // Get dashboard data
    getDashboard: (period) =>
      apiFetch(`/api/users/dashboard${period ? `?period=${period}` : ''}`),

    // Get user's reviews
    getMyReviews: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/users/me/reviews${query ? `?${query}` : ''}`);
    },

    // Get payment history
    getPaymentHistory: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/users/me/payments${query ? `?${query}` : ''}`);
    },

    // Upload profile photo
    uploadPhoto: (formData) => apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    }),
  }), [apiFetch]);

  // ==========================================
  // NOTIFICATION APIs
  // ==========================================
  const notificationApi = useMemo(() => ({
    // Get notifications
    getNotifications: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/notifications${query ? `?${query}` : ''}`);
    },

    // Get single notification
    getNotification: (id) => apiFetch(`/api/notifications/${id}`),

    // Mark as read
    markAsRead: (id) => apiFetch(`/api/notifications/${id}`, { method: 'PUT' }),

    // Mark all as read
    markAllAsRead: () => apiFetch('/api/notifications', { method: 'PUT' }),

    // Delete notification
    deleteNotification: (id) => apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }),

    // Delete all read notifications
    deleteAllRead: () => apiFetch('/api/notifications', { method: 'DELETE' }),

    // Get notification preferences
    getPreferences: () => apiFetch('/api/notifications/preferences'),

    // Update preferences
    updatePreferences: (data) => apiFetch('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Get unread count
    getUnreadCount: () => apiFetch('/api/notifications/count'),

    // Subscribe to push notifications
    subscribe: (subscription) => apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    }),

    // Unsubscribe from push
    unsubscribe: () => apiFetch('/api/notifications/unsubscribe', { method: 'POST' }),
  }), [apiFetch]);

  // ==========================================
  // FAVORITES APIs
  // ==========================================
  const favoriteApi = useMemo(() => ({
    // Get favorites
    getFavorites: () => apiFetch('/api/favorites'),

    // Add to favorites
    addFavorite: (venueId) => apiFetch('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ venueId })
    }),

    // Remove from favorites
    removeFavorite: (venueId) => apiFetch(`/api/favorites?venueId=${venueId}`, {
      method: 'DELETE'
    }),

    // Check if favorited
    isFavorited: (venueId) => apiFetch(`/api/favorites/check?venueId=${venueId}`),
  }), [apiFetch]);

  // ==========================================
  // MISC APIs (Sports, Amenities, etc.)
  // ==========================================
  const miscApi = useMemo(() => ({
    // Get home page data
    getHomeData: () => apiFetch('/api/home'),

    // Get all amenities
    getAmenities: () => apiFetch('/api/amenities'),

    // Get all sports
    getSports: () => apiFetch('/api/sports'),

    // Get popular sports
    getPopularSports: () => apiFetch('/api/sports/popular'),

    // Submit report
    submitReport: (data) => apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Get user's reports
    getReports: () => apiFetch('/api/reports'),

    // Apply coupon
    applyCoupon: (code, bookingData) => apiFetch('/api/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, ...bookingData })
    }),
  }), [apiFetch]);

  // ==========================================
  // UPLOAD APIs
  // ==========================================
  const uploadApi = useMemo(() => ({
    // Upload facility photos
    uploadFacilityPhotos: (venueId, formData) => {
      formData.append('facilityId', venueId);
      return apiFetch('/api/upload/facility-photos', {
        method: 'POST',
        body: formData
      });
    },

    // Get facility photos
    getFacilityPhotos: (venueId) => apiFetch(`/api/upload/facility-photos?facilityId=${venueId}`),

    // Delete facility photo
    deleteFacilityPhoto: (photoId) => apiFetch(`/api/upload/facility-photos/${photoId}`, {
      method: 'DELETE'
    }),
  }), [apiFetch]);

  // ==========================================
  // OWNER APIs
  // ==========================================
  const ownerApi = useMemo(() => ({
    // Get dashboard
    getDashboard: (period) =>
      apiFetch(`/api/owner/dashboard${period ? `?period=${period}` : ''}`),

    // Get reviews for owner's venues
    getReviews: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/owner/reviews${query ? `?${query}` : ''}`);
    },

    // Get earnings summary
    getEarnings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/owner/earnings${query ? `?${query}` : ''}`);
    },

    // Get facilities
    getFacilities: () => apiFetch('/api/owner/facilities'),

    // Get facility bookings
    getBookings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/owner/bookings${query ? `?${query}` : ''}`);
    },
  }), [apiFetch]);

  // ==========================================
  // ADMIN APIs
  // ==========================================
  const adminApi = useMemo(() => ({
    // Dashboard & Analytics
    getAnalytics: (period) =>
      apiFetch(`/api/admin/analytics${period ? `?period=${period}` : ''}`),

    getSearchAnalytics: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/analytics/search${query ? `?${query}` : ''}`);
    },

    getRevenue: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/revenue${query ? `?${query}` : ''}`);
    },

    // User Management
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/users${query ? `?${query}` : ''}`);
    },

    getUser: (id) => apiFetch(`/api/admin/users/${id}`),

    updateUser: (id, data) => apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    deleteUser: (id) => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),

    changeUserRole: (id, role) => apiFetch(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

    // Venue Management
    getVenues: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/venues${query ? `?${query}` : ''}`);
    },

    getVenue: (id) => apiFetch(`/api/admin/venues/${id}`),

    // Facility Approvals
    getApprovals: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/approvals${query ? `?${query}` : ''}`);
    },

    processApproval: (id, action, reason) => apiFetch('/api/admin/approvals', {
      method: 'POST',
      body: JSON.stringify({ venueId: id, action, reason })
    }),

    // Booking Management
    getBookings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/bookings${query ? `?${query}` : ''}`);
    },

    getBooking: (id) => apiFetch(`/api/admin/bookings/${id}`),

    updateBooking: (id, data) => apiFetch(`/api/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    cancelBooking: (id, reason) => apiFetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    }),

    // Court Management
    getCourts: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/courts${query ? `?${query}` : ''}`);
    },

    bulkUpdateCourts: (data) => apiFetch('/api/admin/courts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Review Management
    getReviews: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/reviews${query ? `?${query}` : ''}`);
    },

    getReview: (id) => apiFetch(`/api/admin/reviews/${id}`),

    moderateReview: (id, action, reason) => apiFetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason })
    }),

    deleteReview: (id) => apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }),

    // Payment Management
    getPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/payments${query ? `?${query}` : ''}`);
    },

    getPayment: (id) => apiFetch(`/api/admin/payments/${id}`),

    updatePayment: (id, data) => apiFetch(`/api/admin/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    // Refund Management
    getRefunds: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/refunds${query ? `?${query}` : ''}`);
    },

    processRefund: (data) => apiFetch('/api/admin/refunds', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Notification Management
    getNotifications: () => apiFetch('/api/admin/notifications'),

    sendNotification: (data) => apiFetch('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Moderation
    getModerationQueue: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/api/admin/moderation${query ? `?${query}` : ''}`);
    },

    getModerationItem: (id) => apiFetch(`/api/admin/moderation/${id}`),

    moderateItem: (id, action, reason) => apiFetch(`/api/admin/moderation/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason })
    }),
  }), [apiFetch]);

  // Context value with all API namespaces
  const value = useMemo(() => ({
    // Base fetch for custom calls
    apiFetch,

    // API namespaces
    venue: venueApi,
    court: courtApi,
    review: reviewApi,
    booking: bookingApi,
    payment: paymentApi,
    user: userApi,
    notification: notificationApi,
    favorite: favoriteApi,
    misc: miscApi,
    upload: uploadApi,
    owner: ownerApi,
    admin: adminApi,
  }), [
    apiFetch,
    venueApi,
    courtApi,
    reviewApi,
    bookingApi,
    paymentApi,
    userApi,
    notificationApi,
    favoriteApi,
    miscApi,
    uploadApi,
    ownerApi,
    adminApi,
  ]);

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Hook to use API context
 * @returns {Object} API methods organized by namespace
 *
 * @example
 * const { venue, booking, user } = useApi();
 *
 * // Get venues
 * const { success, data } = await venue.getVenues({ city: 'Delhi' });
 *
 * // Create booking
 * const result = await booking.createBooking({ venueId, courtId, slots });
 *
 * // Get user profile
 * const profile = await user.getProfile();
 */
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export default ApiContext;
