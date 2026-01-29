-- Test Data SQL Queries for QuickCourt APIs
-- Run these in order to populate your database

-- 1. Insert Users (roles: USER, FACILITY_OWNER, ADMIN) - Skip existing users
INSERT INTO users (id, email, password, name, phone, role, "isVerified", "createdAt", "updatedAt") VALUES
('user-test-001', 'testuser1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Test User', '+91-9876543220', 'USER', true, NOW(), NOW()),
('user-test-002', 'testuser2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Test User', '+91-9876543221', 'USER', true, NOW(), NOW()),
('owner-test-001', 'testowner1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Owner 1', '+91-9876543222', 'FACILITY_OWNER', true, NOW(), NOW()),
('owner-test-002', 'testowner2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Owner 2', '+91-9876543223', 'FACILITY_OWNER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Additional Amenities (keeping existing ones)
INSERT INTO amenities (id, name, icon) VALUES
('amenity-005', 'First Aid', '🩹'),
('amenity-006', 'Cafeteria', '☕'),
('amenity-008', 'AC', '❄️'),
('amenity-009', 'Lighting', '💡'),
('amenity-010', 'Seating Area', '🪑'),
('amenity-011', 'Equipment Rental', '🎾'),
('amenity-012', 'Coaching Available', '👨‍🏫'),
('amenity-013', 'Security', '🔒')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Facilities (Venues)
INSERT INTO facilities (id, name, description, address, city, state, pincode, latitude, longitude, status, "adminNote", "approvedAt", "approvedBy", "ownerId", "createdAt", "updatedAt") VALUES
('facility-001', 'Sports Arena Delhi', 'Premium badminton and tennis facility with modern courts and excellent facilities', '123 Sports Complex, Connaught Place', 'Delhi', 'Delhi', '110001', 28.6139, 77.2090, 'APPROVED', 'Excellent facility approved', NOW() - INTERVAL '30 days', (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 'owner-test-001', NOW() - INTERVAL '45 days', NOW()),
('facility-002', 'Mumbai Sports Hub', 'Multi-sport facility with basketball, badminton and tennis courts', '456 Marine Drive, Nariman Point', 'Mumbai', 'Maharashtra', '400001', 18.9220, 72.8234, 'APPROVED', 'Good facility approved', NOW() - INTERVAL '25 days', (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 'owner-test-002', NOW() - INTERVAL '40 days', NOW()),
('facility-003', 'Bangalore Tennis Academy', 'Professional tennis courts with coaching facility', '789 MG Road, Bangalore', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, 'APPROVED', 'Professional setup approved', NOW() - INTERVAL '20 days', (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 'owner-test-001', NOW() - INTERVAL '35 days', NOW()),
('facility-004', 'City Sports Complex', 'Large facility with multiple sports courts and amenities', '321 City Center, Sector 1', 'Gurgaon', 'Haryana', '122001', 28.4595, 77.0266, 'APPROVED', 'Well-equipped facility', NOW() - INTERVAL '15 days', (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 'owner-test-002', NOW() - INTERVAL '30 days', NOW()),
('facility-005', 'Hyderabad Badminton Center', 'Dedicated badminton facility with 6 courts', '567 HITEC City, Madhapur', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3908, 'PENDING', NULL, NULL, NULL, 'owner-test-001', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Facility Photos
INSERT INTO facility_photos (id, url, caption, "facilityId", "createdAt") VALUES
('photo-001', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', 'Main entrance and reception area', 'facility-001', NOW()),
('photo-002', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 'Badminton courts with professional lighting', 'facility-001', NOW()),
('photo-003', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800', 'Tennis courts overview', 'facility-002', NOW()),
('photo-004', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800', 'Basketball court with modern flooring', 'facility-002', NOW()),
('photo-005', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'Professional tennis courts', 'facility-003', NOW()),
('photo-006', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 'Multi-sport facility overview', 'facility-004', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Facility Amenities (using existing amenity IDs)
INSERT INTO facility_amenities ("facilityId", "amenityId") VALUES
-- Sports Arena Delhi amenities (using existing amenity IDs)
('facility-001', 'amenity-001'), ('facility-001', 'amenity-002'), ('facility-001', 'amenity-003'),
('facility-001', 'amenity-004'), ('facility-001', 'amenity-008'), ('facility-001', 'amenity-009'),
-- Mumbai Sports Hub amenities  
('facility-002', 'amenity-001'), ('facility-002', 'amenity-002'), ('facility-002', 'amenity-003'),
('facility-002', 'amenity-004'), ('facility-002', 'amenity-006'),
-- Bangalore Tennis Academy amenities
('facility-003', 'amenity-001'), ('facility-003', 'amenity-002'), ('facility-003', 'amenity-003'),
('facility-003', 'amenity-011'), ('facility-003', 'amenity-012'),
-- City Sports Complex amenities
('facility-004', 'amenity-001'), ('facility-004', 'amenity-002'), ('facility-004', 'amenity-003'),
('facility-004', 'amenity-004'), ('facility-004', 'amenity-005'), ('facility-004', 'amenity-006')
ON CONFLICT ("facilityId", "amenityId") DO NOTHING;

-- 6. Insert Courts
INSERT INTO courts (id, name, description, "sportType", "pricePerHour", "isActive", "openingTime", "closingTime", "facilityId", "createdAt", "updatedAt") VALUES
-- Sports Arena Delhi courts
('court-001', 'Badminton Court 1', 'Premium wooden flooring with international standards', 'BADMINTON', 400.00, true, '06:00', '22:00', 'facility-001', NOW(), NOW()),
('court-002', 'Badminton Court 2', 'Premium wooden flooring with international standards', 'BADMINTON', 400.00, true, '06:00', '22:00', 'facility-001', NOW(), NOW()),
('court-003', 'Tennis Court 1', 'Clay court with professional net', 'TENNIS', 600.00, true, '06:00', '20:00', 'facility-001', NOW(), NOW()),
-- Mumbai Sports Hub courts
('court-004', 'Basketball Court 1', 'Full size court with wooden flooring', 'BASKETBALL', 800.00, true, '07:00', '21:00', 'facility-002', NOW(), NOW()),
('court-005', 'Badminton Court 3', 'Synthetic court with good lighting', 'BADMINTON', 350.00, true, '06:30', '22:00', 'facility-002', NOW(), NOW()),
('court-006', 'Tennis Court 2', 'Hard court surface', 'TENNIS', 500.00, true, '06:00', '20:00', 'facility-002', NOW(), NOW()),
-- Bangalore Tennis Academy courts
('court-007', 'Tennis Court 3', 'Professional clay court', 'TENNIS', 700.00, true, '05:30', '21:00', 'facility-003', NOW(), NOW()),
('court-008', 'Tennis Court 4', 'Hard court with flood lights', 'TENNIS', 650.00, true, '05:30', '21:00', 'facility-003', NOW(), NOW()),
-- City Sports Complex courts
('court-009', 'Badminton Court 4', 'Competition standard court', 'BADMINTON', 450.00, true, '06:00', '22:00', 'facility-004', NOW(), NOW()),
('court-010', 'Badminton Court 5', 'Competition standard court', 'BADMINTON', 450.00, true, '06:00', '22:00', 'facility-004', NOW(), NOW()),
('court-011', 'Football Turf 1', '5-a-side artificial turf', 'FOOTBALL', 1200.00, true, '06:00', '23:00', 'facility-004', NOW(), NOW()),
('court-012', 'Table Tennis 1', 'Professional table tennis setup', 'TABLE_TENNIS', 200.00, true, '08:00', '20:00', 'facility-004', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Time Slots
INSERT INTO time_slots (id, date, "startTime", "endTime", "isBlocked", "blockReason", "courtId", "createdAt") VALUES
-- Time slots for today and next few days
('slot-001', CURRENT_DATE, '08:00', '09:00', false, NULL, 'court-001', NOW()),
('slot-002', CURRENT_DATE, '09:00', '10:00', false, NULL, 'court-001', NOW()),
('slot-003', CURRENT_DATE, '10:00', '11:00', false, NULL, 'court-001', NOW()),
('slot-004', CURRENT_DATE + 1, '08:00', '09:00', false, NULL, 'court-002', NOW()),
('slot-005', CURRENT_DATE + 1, '09:00', '10:00', false, NULL, 'court-002', NOW()),
('slot-006', CURRENT_DATE + 1, '18:00', '19:00', false, NULL, 'court-003', NOW()),
('slot-007', CURRENT_DATE + 2, '07:00', '08:00', false, NULL, 'court-004', NOW()),
('slot-008', CURRENT_DATE + 2, '08:00', '09:00', false, NULL, 'court-004', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Bookings (facility-001 has most bookings = most popular)
INSERT INTO bookings (id, "bookingDate", "startTime", "endTime", "totalAmount", status, "paymentId", "userId", "courtId", "timeSlotId", "createdAt", "updatedAt") VALUES
-- More bookings for facility-001 (should be most popular)
('booking-001', CURRENT_DATE - 5, '08:00', '09:00', 400.00, 'CONFIRMED', 'pay_001', 'user-test-001', 'court-001', NULL, NOW() - INTERVAL '5 days', NOW()),
('booking-002', CURRENT_DATE - 4, '09:00', '10:00', 400.00, 'CONFIRMED', 'pay_002', 'user-test-002', 'court-001', NULL, NOW() - INTERVAL '4 days', NOW()),
('booking-003', CURRENT_DATE - 3, '10:00', '11:00', 400.00, 'CONFIRMED', 'pay_003', 'user-test-001', 'court-002', NULL, NOW() - INTERVAL '3 days', NOW()),
('booking-004', CURRENT_DATE - 2, '18:00', '19:00', 600.00, 'CONFIRMED', 'pay_004', 'user-test-002', 'court-003', NULL, NOW() - INTERVAL '2 days', NOW()),
('booking-005', CURRENT_DATE - 1, '08:00', '09:00', 400.00, 'CONFIRMED', 'pay_005', 'user-test-001', 'court-001', NULL, NOW() - INTERVAL '1 day', NOW()),
-- Some bookings for facility-002
('booking-006', CURRENT_DATE - 3, '07:00', '08:00', 800.00, 'CONFIRMED', 'pay_006', 'user-test-002', 'court-004', NULL, NOW() - INTERVAL '3 days', NOW()),
('booking-007', CURRENT_DATE - 2, '06:30', '07:30', 350.00, 'CONFIRMED', 'pay_007', 'user-test-001', 'court-005', NULL, NOW() - INTERVAL '2 days', NOW()),
-- Some bookings for facility-003
('booking-008', CURRENT_DATE - 1, '06:00', '07:00', 700.00, 'CONFIRMED', 'pay_008', 'user-test-002', 'court-007', NULL, NOW() - INTERVAL '1 day', NOW()),
-- Some bookings for facility-004
('booking-009', CURRENT_DATE - 4, '06:00', '07:00', 450.00, 'CONFIRMED', 'pay_009', 'user-test-001', 'court-009', NULL, NOW() - INTERVAL '4 days', NOW()),
('booking-010', CURRENT_DATE - 1, '06:00', '07:00', 1200.00, 'CONFIRMED', 'pay_010', 'user-test-002', 'court-011', NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Reviews (to test reviews API)
INSERT INTO reviews (id, rating, comment, "userId", "facilityId", "createdAt", "updatedAt") VALUES
('review-001', 5, 'Excellent facility with top-notch courts and great amenities!', 'user-test-001', 'facility-001', NOW() - INTERVAL '2 days', NOW()),
('review-002', 4, 'Good courts and friendly staff. Parking could be better.', 'user-test-002', 'facility-001', NOW() - INTERVAL '1 day', NOW()),
('review-003', 5, 'Amazing experience! Will definitely come back.', 'user-test-001', 'facility-001', NOW() - INTERVAL '6 hours', NOW()),
('review-004', 4, 'Great basketball court, well maintained.', 'user-test-002', 'facility-002', NOW() - INTERVAL '3 days', NOW()),
('review-005', 3, 'Average facility, needs some improvement in cleanliness.', 'user-test-001', 'facility-002', NOW() - INTERVAL '1 day', NOW()),
('review-006', 5, 'Professional tennis academy with excellent coaching!', 'user-test-002', 'facility-003', NOW() - INTERVAL '12 hours', NOW()),
('review-007', 4, 'Good facility with multiple sports options.', 'user-test-001', 'facility-004', NOW() - INTERVAL '2 days', NOW()),
('review-008', 4, 'Love the badminton courts here!', 'user-test-002', 'facility-001', NOW() - INTERVAL '3 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- Check data insertion
SELECT 'Data insertion completed successfully!' as status;