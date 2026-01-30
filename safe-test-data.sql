-- Safe Test Data SQL Queries for QuickCourt APIs
-- This version handles conflicts with existing data

-- 1. Insert Users (with conflict handling)
INSERT INTO users (id, email, password, name, phone, role, "isVerified", "createdAt", "updatedAt") VALUES
('user-test-001', 'testuser1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Test User', '+91-9876543220', 'USER', true, NOW(), NOW()),
('user-test-002', 'testuser2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Test User', '+91-9876543221', 'USER', true, NOW(), NOW()),
('owner-test-001', 'testowner1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Owner 1', '+91-9876543222', 'FACILITY_OWNER', true, NOW(), NOW()),
('owner-test-002', 'testowner2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Owner 2', '+91-9876543223', 'FACILITY_OWNER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Amenities (with conflict handling)
INSERT INTO amenities (id, name, icon) VALUES
('amenity-test-001', 'Parking', '🅿️'),
('amenity-test-002', 'Changing Rooms', '🚿'),
('amenity-test-003', 'Washrooms', '🚻'),
('amenity-test-004', 'Drinking Water', '💧'),
('amenity-test-005', 'First Aid', '🩹'),
('amenity-test-006', 'Cafeteria', '☕'),
('amenity-test-007', 'WiFi', '📶'),
('amenity-test-008', 'AC', '❄️'),
('amenity-test-009', 'Lighting', '💡'),
('amenity-test-010', 'Seating Area', '🪑')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Facilities (Venues)
INSERT INTO facilities (id, name, description, address, city, state, pincode, latitude, longitude, status, "adminNote", "approvedAt", "approvedBy", "ownerId", "createdAt", "updatedAt") VALUES
('facility-test-001', 'Test Sports Arena Delhi', 'Premium badminton and tennis facility for testing', '123 Test Sports Complex, CP', 'Delhi', 'Delhi', '110001', 28.6139, 77.2090, 'APPROVED', 'Test facility approved', NOW() - INTERVAL '30 days', 'cmkz22b0p0000io5s0qqpndaw', 'owner-test-001', NOW() - INTERVAL '45 days', NOW()),
('facility-test-002', 'Test Mumbai Sports Hub', 'Multi-sport facility for API testing', '456 Test Marine Drive', 'Mumbai', 'Maharashtra', '400001', 18.9220, 72.8234, 'APPROVED', 'Good test facility', NOW() - INTERVAL '25 days', 'cmkz22b0p0000io5s0qqpndaw', 'owner-test-002', NOW() - INTERVAL '40 days', NOW()),
('facility-test-003', 'Test Bangalore Academy', 'Professional tennis courts for testing', '789 Test MG Road', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, 'APPROVED', 'Professional test setup', NOW() - INTERVAL '20 days', 'cmkz22b0p0000io5s0qqpndaw', 'owner-test-001', NOW() - INTERVAL '35 days', NOW()),
('facility-test-004', 'Test City Complex', 'Large test facility with multiple courts', '321 Test City Center', 'Gurgaon', 'Haryana', '122001', 28.4595, 77.0266, 'APPROVED', 'Well-equipped test facility', NOW() - INTERVAL '15 days', 'cmkz22b0p0000io5s0qqpndaw', 'owner-test-002', NOW() - INTERVAL '30 days', NOW()),
('facility-test-005', 'Test Pending Venue', 'Test venue in pending status', '567 Test HITEC City', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3908, 'PENDING', NULL, NULL, NULL, 'owner-test-001', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Facility Photos
INSERT INTO facility_photos (id, url, caption, "facilityId", "createdAt") VALUES
('photo-test-001', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', 'Test main entrance', 'facility-test-001', NOW()),
('photo-test-002', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 'Test badminton courts', 'facility-test-001', NOW()),
('photo-test-003', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800', 'Test tennis courts', 'facility-test-002', NOW()),
('photo-test-004', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800', 'Test basketball court', 'facility-test-002', NOW()),
('photo-test-005', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'Test professional courts', 'facility-test-003', NOW()),
('photo-test-006', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 'Test multi-sport facility', 'facility-test-004', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Facility Amenities (Junction Table)
INSERT INTO facility_amenities ("facilityId", "amenityId") VALUES
-- Test Sports Arena Delhi amenities
('facility-test-001', 'amenity-test-001'), ('facility-test-001', 'amenity-test-002'),
('facility-test-001', 'amenity-test-003'), ('facility-test-001', 'amenity-test-007'),
('facility-test-001', 'amenity-test-008'), ('facility-test-001', 'amenity-test-009'),
-- Test Mumbai Sports Hub amenities  
('facility-test-002', 'amenity-test-001'), ('facility-test-002', 'amenity-test-002'),
('facility-test-002', 'amenity-test-006'), ('facility-test-002', 'amenity-test-007'),
-- Test Bangalore Academy amenities
('facility-test-003', 'amenity-test-001'), ('facility-test-003', 'amenity-test-004'),
-- Test City Complex amenities
('facility-test-004', 'amenity-test-001'), ('facility-test-004', 'amenity-test-002'),
('facility-test-004', 'amenity-test-003'), ('facility-test-004', 'amenity-test-005')
ON CONFLICT ("facilityId", "amenityId") DO NOTHING;

-- 6. Insert Courts
INSERT INTO courts (id, name, description, "sportType", "pricePerHour", "isActive", "openingTime", "closingTime", "facilityId", "createdAt", "updatedAt") VALUES
-- Test Sports Arena Delhi courts
('court-test-001', 'Test Badminton 1', 'Premium test court', 'BADMINTON', 400.00, true, '06:00', '22:00', 'facility-test-001', NOW(), NOW()),
('court-test-002', 'Test Badminton 2', 'Premium test court', 'BADMINTON', 400.00, true, '06:00', '22:00', 'facility-test-001', NOW(), NOW()),
('court-test-003', 'Test Tennis 1', 'Clay test court', 'TENNIS', 600.00, true, '06:00', '20:00', 'facility-test-001', NOW(), NOW()),
-- Test Mumbai Sports Hub courts
('court-test-004', 'Test Basketball 1', 'Full size test court', 'BASKETBALL', 800.00, true, '07:00', '21:00', 'facility-test-002', NOW(), NOW()),
('court-test-005', 'Test Badminton 3', 'Synthetic test court', 'BADMINTON', 350.00, true, '06:30', '22:00', 'facility-test-002', NOW(), NOW()),
('court-test-006', 'Test Tennis 2', 'Hard test court', 'TENNIS', 500.00, true, '06:00', '20:00', 'facility-test-002', NOW(), NOW()),
-- Test Bangalore Academy courts
('court-test-007', 'Test Tennis 3', 'Professional test court', 'TENNIS', 700.00, true, '05:30', '21:00', 'facility-test-003', NOW(), NOW()),
('court-test-008', 'Test Tennis 4', 'Hard court with lights', 'TENNIS', 650.00, true, '05:30', '21:00', 'facility-test-003', NOW(), NOW()),
-- Test City Complex courts
('court-test-009', 'Test Badminton 4', 'Competition test court', 'BADMINTON', 450.00, true, '06:00', '22:00', 'facility-test-004', NOW(), NOW()),
('court-test-010', 'Test Badminton 5', 'Competition test court', 'BADMINTON', 450.00, true, '06:00', '22:00', 'facility-test-004', NOW(), NOW()),
('court-test-011', 'Test Football Turf', '5-a-side test turf', 'FOOTBALL', 1200.00, true, '06:00', '23:00', 'facility-test-004', NOW(), NOW()),
('court-test-012', 'Test Table Tennis', 'Professional test table', 'TABLE_TENNIS', 200.00, true, '08:00', '20:00', 'facility-test-004', NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Time Slots
INSERT INTO time_slots (id, date, "startTime", "endTime", "isBlocked", "blockReason", "courtId", "createdAt") VALUES
-- Time slots for today and next few days
('slot-test-001', CURRENT_DATE, '08:00', '09:00', false, NULL, 'court-test-001', NOW()),
('slot-test-002', CURRENT_DATE, '09:00', '10:00', false, NULL, 'court-test-001', NOW()),
('slot-test-003', CURRENT_DATE, '10:00', '11:00', false, NULL, 'court-test-001', NOW()),
('slot-test-004', CURRENT_DATE + 1, '08:00', '09:00', false, NULL, 'court-test-002', NOW()),
('slot-test-005', CURRENT_DATE + 1, '09:00', '10:00', false, NULL, 'court-test-002', NOW()),
('slot-test-006', CURRENT_DATE + 1, '18:00', '19:00', false, NULL, 'court-test-003', NOW()),
('slot-test-007', CURRENT_DATE + 2, '07:00', '08:00', false, NULL, 'court-test-004', NOW()),
('slot-test-008', CURRENT_DATE + 2, '08:00', '09:00', false, NULL, 'court-test-004', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Bookings (facility-test-001 will have most bookings = most popular)
INSERT INTO bookings (id, "bookingDate", "startTime", "endTime", "totalAmount", status, "paymentId", "userId", "courtId", "timeSlotId", "createdAt", "updatedAt") VALUES
-- More bookings for facility-test-001 (should be most popular)
('booking-test-001', CURRENT_DATE - 5, '08:00', '09:00', 400.00, 'CONFIRMED', 'pay_test_001', 'user-test-001', 'court-test-001', NULL, NOW() - INTERVAL '5 days', NOW()),
('booking-test-002', CURRENT_DATE - 4, '09:00', '10:00', 400.00, 'CONFIRMED', 'pay_test_002', 'user-test-002', 'court-test-001', NULL, NOW() - INTERVAL '4 days', NOW()),
('booking-test-003', CURRENT_DATE - 3, '10:00', '11:00', 400.00, 'CONFIRMED', 'pay_test_003', 'user-test-001', 'court-test-002', NULL, NOW() - INTERVAL '3 days', NOW()),
('booking-test-004', CURRENT_DATE - 2, '18:00', '19:00', 600.00, 'CONFIRMED', 'pay_test_004', 'user-test-002', 'court-test-003', NULL, NOW() - INTERVAL '2 days', NOW()),
('booking-test-005', CURRENT_DATE - 1, '08:00', '09:00', 400.00, 'CONFIRMED', 'pay_test_005', 'user-test-001', 'court-test-001', NULL, NOW() - INTERVAL '1 day', NOW()),
-- Some bookings for facility-test-002
('booking-test-006', CURRENT_DATE - 3, '07:00', '08:00', 800.00, 'CONFIRMED', 'pay_test_006', 'user-test-002', 'court-test-004', NULL, NOW() - INTERVAL '3 days', NOW()),
('booking-test-007', CURRENT_DATE - 2, '06:30', '07:30', 350.00, 'CONFIRMED', 'pay_test_007', 'user-test-001', 'court-test-005', NULL, NOW() - INTERVAL '2 days', NOW()),
-- Some bookings for facility-test-003
('booking-test-008', CURRENT_DATE - 1, '06:00', '07:00', 700.00, 'CONFIRMED', 'pay_test_008', 'user-test-002', 'court-test-007', NULL, NOW() - INTERVAL '1 day', NOW()),
-- Some bookings for facility-test-004
('booking-test-009', CURRENT_DATE - 4, '06:00', '07:00', 450.00, 'CONFIRMED', 'pay_test_009', 'user-test-001', 'court-test-009', NULL, NOW() - INTERVAL '4 days', NOW()),
('booking-test-010', CURRENT_DATE - 1, '06:00', '07:00', 1200.00, 'CONFIRMED', 'pay_test_010', 'user-test-002', 'court-test-011', NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Reviews (to test reviews API)
INSERT INTO reviews (id, rating, comment, "userId", "facilityId", "createdAt", "updatedAt") VALUES
('review-test-001', 5, 'Excellent test facility with top-notch courts!', 'user-test-001', 'facility-test-001', NOW() - INTERVAL '2 days', NOW()),
('review-test-002', 4, 'Good test courts and friendly staff.', 'user-test-002', 'facility-test-001', NOW() - INTERVAL '1 day', NOW()),
('review-test-003', 5, 'Amazing test experience! Will definitely come back.', 'user-test-001', 'facility-test-001', NOW() - INTERVAL '6 hours', NOW()),
('review-test-004', 4, 'Great test basketball court, well maintained.', 'user-test-002', 'facility-test-002', NOW() - INTERVAL '3 days', NOW()),
('review-test-005', 3, 'Average test facility, needs some improvement.', 'user-test-001', 'facility-test-002', NOW() - INTERVAL '1 day', NOW()),
('review-test-006', 5, 'Professional test tennis academy with excellent coaching!', 'user-test-002', 'facility-test-003', NOW() - INTERVAL '12 hours', NOW()),
('review-test-007', 4, 'Good test facility with multiple sports options.', 'user-test-001', 'facility-test-004', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Final verification
SELECT 'Test data insertion completed successfully!' as status, 
       COUNT(*) as amenities_count FROM amenities WHERE name LIKE '%Test%' OR id LIKE '%test%';