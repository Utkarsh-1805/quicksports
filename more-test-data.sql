    -- ===================================================
    -- MORE TEST DATA FOR NEARBY VENUES & SUGGESTIONS APIS
    -- ===================================================

    -- 0. INSERT MISSING USERS FIRST (for foreign key constraints)
    INSERT INTO users (id, email, name, phone, role, password, "createdAt", "updatedAt") VALUES 
    ('user-001', 'owner1@quickcourt.com', 'Rajesh Kumar', '+919876543210', 'FACILITY_OWNER', '$2a$10$dummy.hash.for.testing.purposes', NOW(), NOW()),
    ('user-002', 'owner2@quickcourt.com', 'Priya Sharma', '+919876543211', 'FACILITY_OWNER', '$2a$10$dummy.hash.for.testing.purposes', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 1. INSERT MORE VENUES WITH PROPER COORDINATES
    -- These venues are spread across different locations in Delhi NCR

    INSERT INTO facilities (
    id, name, description, address, city, state, pincode,
    latitude, longitude, "ownerId", status, "createdAt", "updatedAt"
    ) VALUES 
    -- Delhi Center Area (Near Connaught Place)
    ('facility-006', 'Elite Sports Club', 'Premium sports facility in heart of Delhi with multiple courts', '15 Connaught Place, Delhi', 'New Delhi', 'Delhi', '110001', 28.6304, 77.2177, 'user-001', 'APPROVED', NOW(), NOW()),

    -- South Delhi (Near Green Park)
    ('facility-007', 'Green Park Sports Complex', 'Modern sports complex with badminton and tennis courts', 'A-12 Green Park Main Road', 'New Delhi', 'Delhi', '110016', 28.5665, 77.2070, 'user-002', 'APPROVED', NOW(), NOW()),

    -- North Delhi (Near Red Fort)
    ('facility-008', 'Red Fort Sports Arena', 'Traditional sports facility near historic Red Fort', '5 Red Fort Road, Chandni Chowk', 'Delhi', 'Delhi', '110006', 28.6562, 77.2410, 'user-001', 'APPROVED', NOW(), NOW()),

    -- Gurgaon (Tech Hub)
    ('facility-009', 'Cyber Hub Sports Center', 'Corporate sports facility for IT professionals', 'DLF Cyber City, Phase 2', 'Gurgaon', 'Haryana', '122002', 28.4945, 77.0834, 'user-002', 'APPROVED', NOW(), NOW()),

    -- Noida (Tech City)
    ('facility-010', 'Sector 18 Sports Complex', 'Multi-sport facility in Noida shopping district', 'Sector 18, Near Metro Station', 'Noida', 'Uttar Pradesh', '201301', 28.5675, 77.3206, 'user-001', 'APPROVED', NOW(), NOW()),

    -- Faridabad
    ('facility-011', 'Crown Sports Club', 'Luxury sports club with premium amenities', 'Sector 15A, NIT Road', 'Faridabad', 'Haryana', '121007', 28.4089, 77.3178, 'user-002', 'APPROVED', NOW(), NOW()),

    -- East Delhi (Near Akshardham)
    ('facility-012', 'Akshardham Sports Hub', 'Family-friendly sports facility near temple', 'NH 24, Near Akshardham Temple', 'Delhi', 'Delhi', '110092', 28.6127, 77.2773, 'user-001', 'APPROVED', NOW(), NOW()),

    -- West Delhi (Rajouri Garden)
    ('facility-013', 'Rajouri Sports Paradise', 'Popular sports destination in West Delhi', 'A-4 Rajouri Garden Metro Station Road', 'Delhi', 'Delhi', '110027', 28.6490, 77.1203, 'user-002', 'APPROVED', NOW(), NOW()),

    -- Dwarka (Modern Delhi)
    ('facility-014', 'Dwarka Sports World', 'State-of-the-art sports facility in modern Dwarka', 'Sector 21, Dwarka Sub City', 'Delhi', 'Delhi', '110075', 28.5921, 77.0460, 'user-001', 'APPROVED', NOW(), NOW()),

    -- Mumbai venues for variety
    ('facility-015', 'Marine Drive Sports Club', 'Seaside sports facility with ocean view', 'Marine Drive, Churchgate', 'Mumbai', 'Maharashtra', '400020', 18.9431, 72.8245, 'user-002', 'APPROVED', NOW(), NOW()),

    ('facility-016', 'Bandra Sports Arena', 'Trendy sports facility in Bandra West', 'Linking Road, Bandra West', 'Mumbai', 'Maharashtra', '400050', 19.0596, 72.8295, 'user-001', 'APPROVED', NOW(), NOW()),

    -- Bangalore venues
    ('facility-017', 'Koramangala Sports Hub', 'IT crowd favorite sports facility', '5th Block, Koramangala', 'Bangalore', 'Karnataka', '560095', 12.9352, 77.6245, 'user-002', 'APPROVED', NOW(), NOW()),

    ('facility-018', 'Whitefield Sports Complex', 'Corporate sports facility in IT corridor', 'ITPL Main Road, Whitefield', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7500, 'user-001', 'APPROVED', NOW(), NOW());


    -- 2. INSERT COURTS FOR THESE NEW VENUES
    INSERT INTO courts (
    id, "facilityId", name, "sportType", "pricePerHour", "isActive", "createdAt", "updatedAt"
    ) VALUES 
    -- Elite Sports Club courts
    ('court-021', 'facility-006', 'Elite Badminton Court 1', 'BADMINTON', 400, true, NOW(), NOW()),
    ('court-022', 'facility-006', 'Elite Tennis Court 1', 'TENNIS', 800, true, NOW(), NOW()),
    ('court-023', 'facility-006', 'Elite Basketball Court', 'BASKETBALL', 600, true, NOW(), NOW()),

    -- Green Park Sports Complex
    ('court-024', 'facility-007', 'Green Court 1', 'BADMINTON', 350, true, NOW(), NOW()),
    ('court-025', 'facility-007', 'Green Court 2', 'BADMINTON', 350, true, NOW(), NOW()),
    ('court-026', 'facility-007', 'Green Tennis Court', 'TENNIS', 700, true, NOW(), NOW()),

    -- Red Fort Sports Arena
    ('court-027', 'facility-008', 'Heritage Badminton Court', 'BADMINTON', 300, true, NOW(), NOW()),
    ('court-028', 'facility-008', 'Heritage Table Tennis', 'TABLE_TENNIS', 200, true, NOW(), NOW()),

    -- Cyber Hub Sports Center
    ('court-029', 'facility-009', 'Corporate Court 1', 'BADMINTON', 500, true, NOW(), NOW()),
    ('court-030', 'facility-009', 'Corporate Court 2', 'BADMINTON', 500, true, NOW(), NOW()),
    ('court-031', 'facility-009', 'Executive Tennis Court', 'TENNIS', 1000, true, NOW(), NOW()),

    -- Sector 18 Sports Complex
    ('court-032', 'facility-010', 'Metro Badminton Court 1', 'BADMINTON', 380, true, NOW(), NOW()),
    ('court-033', 'facility-010', 'Metro Badminton Court 2', 'BADMINTON', 380, true, NOW(), NOW()),
    ('court-034', 'facility-010', 'Metro Basketball Court', 'BASKETBALL', 550, true, NOW(), NOW()),

    -- Crown Sports Club
    ('court-035', 'facility-011', 'Crown Premium Court 1', 'BADMINTON', 450, true, NOW(), NOW()),
    ('court-036', 'facility-011', 'Crown Premium Court 2', 'TENNIS', 900, true, NOW(), NOW()),

    -- Akshardham Sports Hub
    ('court-037', 'facility-012', 'Temple View Badminton', 'BADMINTON', 320, true, NOW(), NOW()),
    ('court-038', 'facility-012', 'Family Basketball Court', 'BASKETBALL', 500, true, NOW(), NOW()),

    -- Rajouri Sports Paradise
    ('court-039', 'facility-013', 'Paradise Badminton 1', 'BADMINTON', 360, true, NOW(), NOW()),
    ('court-040', 'facility-013', 'Paradise Badminton 2', 'BADMINTON', 360, true, NOW(), NOW()),

    -- Dwarka Sports World
    ('court-041', 'facility-014', 'Modern Badminton Court 1', 'BADMINTON', 400, true, NOW(), NOW()),
    ('court-042', 'facility-014', 'Modern Tennis Court', 'TENNIS', 750, true, NOW(), NOW()),

    -- Mumbai venues
    ('court-043', 'facility-015', 'Seaside Badminton Court', 'BADMINTON', 600, true, NOW(), NOW()),
    ('court-044', 'facility-015', 'Ocean View Tennis Court', 'TENNIS', 1200, true, NOW(), NOW()),

    ('court-045', 'facility-016', 'Bandra Badminton Court 1', 'BADMINTON', 550, true, NOW(), NOW()),
    ('court-046', 'facility-016', 'Bandra Badminton Court 2', 'BADMINTON', 550, true, NOW(), NOW()),

    -- Bangalore venues
    ('court-047', 'facility-017', 'Tech Hub Badminton', 'BADMINTON', 450, true, NOW(), NOW()),
    ('court-048', 'facility-017', 'Koramangala Tennis Court', 'TENNIS', 800, true, NOW(), NOW()),

    ('court-049', 'facility-018', 'IT Corridor Badminton 1', 'BADMINTON', 500, true, NOW(), NOW()),
    ('court-050', 'facility-018', 'IT Corridor Badminton 2', 'BADMINTON', 500, true, NOW(), NOW());


    -- 3. ADD AMENITIES TO NEW VENUES
    INSERT INTO facility_amenities ("facilityId", "amenityId") VALUES 
    -- Elite Sports Club (all amenities)
    ('facility-006', 'amenity-001'),
    ('facility-006', 'amenity-002'),
    ('facility-006', 'amenity-003'),

    -- Green Park (parking + wifi)
    ('facility-007', 'amenity-001'),
    ('facility-007', 'amenity-002'),

    -- Red Fort (only cafeteria)
    ('facility-008', 'amenity-003'),

    -- Cyber Hub (all corporate amenities)
    ('facility-009', 'amenity-001'),
    ('facility-009', 'amenity-002'),
    ('facility-009', 'amenity-003'),

    -- Sector 18 (parking + wifi)
    ('facility-010', 'amenity-001'),
    ('facility-010', 'amenity-002'),

    -- Crown Sports (luxury amenities)
    ('facility-011', 'amenity-001'),
    ('facility-011', 'amenity-002'),
    ('facility-011', 'amenity-003'),

    -- Akshardham (family friendly)
    ('facility-012', 'amenity-001'),
    ('facility-012', 'amenity-003'),

    -- Rajouri (basic amenities)
    ('facility-013', 'amenity-001'),
    ('facility-013', 'amenity-002'),

    -- Dwarka (modern amenities)
    ('facility-014', 'amenity-001'),
    ('facility-014', 'amenity-002'),
    ('facility-014', 'amenity-003'),

    -- Mumbai venues
    ('facility-015', 'amenity-001'),
    ('facility-015', 'amenity-002'),
    ('facility-015', 'amenity-003'),

    ('facility-016', 'amenity-001'),
    ('facility-016', 'amenity-002'),

    -- Bangalore venues
    ('facility-017', 'amenity-001'),
    ('facility-017', 'amenity-002'),
    ('facility-017', 'amenity-003'),

    ('facility-018', 'amenity-001'),
    ('facility-018', 'amenity-002');


    -- 4. ADD SAMPLE PHOTOS
    INSERT INTO photos (id, "facilityId", url, "createdAt") VALUES 
    ('photo-006', 'facility-006', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', NOW()),
    ('photo-007', 'facility-007', 'https://images.unsplash.com/photo-1571019612062-5a43b9afc57d', NOW()),
    ('photo-008', 'facility-008', 'https://images.unsplash.com/photo-1571019613274-1cb2f99b2d8c', NOW()),
    ('photo-009', 'facility-009', 'https://images.unsplash.com/photo-1571019614563-5a43b9afc58e', NOW()),
    ('photo-010', 'facility-010', 'https://images.unsplash.com/photo-1571019615674-1cb2f99b2d8f', NOW()),
    ('photo-011', 'facility-011', 'https://images.unsplash.com/photo-1571019616785-5a43b9afc590', NOW()),
    ('photo-012', 'facility-012', 'https://images.unsplash.com/photo-1571019617896-1cb2f99b2d91', NOW()),
    ('photo-013', 'facility-013', 'https://images.unsplash.com/photo-1571019618907-5a43b9afc592', NOW()),
    ('photo-014', 'facility-014', 'https://images.unsplash.com/photo-1571019619018-1cb2f99b2d93', NOW()),
    ('photo-015', 'facility-015', 'https://images.unsplash.com/photo-1571019620129-5a43b9afc594', NOW()),
    ('photo-016', 'facility-016', 'https://images.unsplash.com/photo-1571019621240-1cb2f99b2d95', NOW()),
    ('photo-017', 'facility-017', 'https://images.unsplash.com/photo-1571019622351-5a43b9afc596', NOW()),
    ('photo-018', 'facility-018', 'https://images.unsplash.com/photo-1571019623462-1cb2f99b2d97', NOW());


    -- 5. ADD SAMPLE REVIEWS FOR RATING TESTS
    INSERT INTO reviews (id, "userId", "facilityId", rating, comment, "createdAt") VALUES 
    -- Elite Sports Club reviews
    ('review-021', 'user-003', 'facility-006', 5, 'Excellent facility with top-notch courts and equipment', NOW()),
    ('review-022', 'user-004', 'facility-006', 4, 'Great location in CP, easy to reach by metro', NOW()),

    -- Green Park reviews  
    ('review-023', 'user-003', 'facility-007', 4, 'Good courts, well maintained and clean', NOW()),
    ('review-024', 'user-004', 'facility-007', 5, 'Love the Green Park location, very convenient', NOW()),

    -- Red Fort reviews
    ('review-025', 'user-003', 'facility-008', 3, 'Decent facility, historic area is nice', NOW()),

    -- Cyber Hub reviews
    ('review-026', 'user-003', 'facility-009', 5, 'Perfect for office tournaments, great corporate rates', NOW()),
    ('review-027', 'user-004', 'facility-009', 5, 'High-end facility, premium experience', NOW()),

    -- Sector 18 reviews
    ('review-028', 'user-003', 'facility-010', 4, 'Convenient metro connectivity, good for quick games', NOW()),

    -- Crown Sports reviews
    ('review-029', 'user-003', 'facility-011', 5, 'Luxury experience, worth the premium pricing', NOW()),
    ('review-030', 'user-004', 'facility-011', 4, 'Beautiful facility in Faridabad', NOW()),

    -- Mumbai reviews
    ('review-031', 'user-003', 'facility-015', 5, 'Amazing ocean view while playing, unique experience', NOW()),
    ('review-032', 'user-004', 'facility-016', 4, 'Great facility in trendy Bandra area', NOW()),

    -- Bangalore reviews
    ('review-033', 'user-003', 'facility-017', 5, 'Perfect for IT professionals, great after-work location', NOW()),
    ('review-034', 'user-004', 'facility-018', 4, 'Good facility in Whitefield tech corridor', NOW());

    -- Summary of new test data:
    -- ✅ 13 new venues with proper lat/lng coordinates
    -- ✅ Spread across Delhi NCR, Mumbai, Bangalore  
    -- ✅ 30 new courts with different sports and prices
    -- ✅ Various amenity combinations for filtering tests
    -- ✅ Sample photos for each venue
    -- ✅ Reviews for rating/popularity tests

    COMMIT;