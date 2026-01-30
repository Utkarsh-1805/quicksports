-- Check existing data and fix reviews
-- Run this step by step in Neon SQL Editor

-- 1. First, let's see what users actually exist
SELECT id, name, email, role FROM users ORDER BY "createdAt" DESC LIMIT 10;

-- 2. Check what facilities exist  
SELECT id, name, status FROM facilities WHERE status = 'APPROVED' ORDER BY "createdAt" DESC;

-- 3. Check if any reviews exist
SELECT COUNT(*) as review_count FROM reviews;

-- 4. FIXED: Insert reviews using ACTUAL user and facility IDs (Each user reviews each facility only ONCE)
INSERT INTO reviews (id, rating, comment, "userId", "facilityId", "createdAt", "updatedAt") 
VALUES 
-- user-test-001 reviews facility-004 (City Sports Complex)
('review-working-001', 5, 'Excellent facility with top-notch courts and great amenities!', 
 'user-test-001', 'facility-004', NOW() - INTERVAL '2 days', NOW()),
 
-- user-test-002 reviews facility-004 (City Sports Complex) 
('review-working-002', 4, 'Good courts and friendly staff. Parking could be better.', 
 'user-test-002', 'facility-004', NOW() - INTERVAL '1 day', NOW()),
 
-- user-test-001 reviews facility-002 (Mumbai Sports Hub)
('review-working-003', 3, 'Average facility, needs some improvement in cleanliness.', 
 'user-test-001', 'facility-002', NOW() - INTERVAL '1 day', NOW()),
 
-- user-test-002 reviews facility-002 (Mumbai Sports Hub)
('review-working-004', 4, 'Great basketball court, well maintained.', 
 'user-test-002', 'facility-002', NOW() - INTERVAL '3 days', NOW()),
 
-- user-test-001 reviews facility-003 (Bangalore Tennis Academy)
('review-working-005', 4, 'Good facility with multiple sports options.', 
 'user-test-001', 'facility-003', NOW() - INTERVAL '2 days', NOW()),
 
-- user-test-002 reviews facility-003 (Bangalore Tennis Academy)
('review-working-006', 5, 'Professional tennis academy with excellent coaching!', 
 'user-test-002', 'facility-003', NOW() - INTERVAL '12 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Verify reviews were inserted
SELECT r.id, r.rating, r.comment, u.name as user_name, f.name as facility_name, r."createdAt"
FROM reviews r 
JOIN users u ON r."userId" = u.id 
JOIN facilities f ON r."facilityId" = f.id 
ORDER BY r."createdAt" DESC;

-- 6. Check specifically for facility-004 reviews (most reviews)
SELECT COUNT(*) as facility_004_reviews 
FROM reviews 
WHERE "facilityId" = 'facility-004';

-- 7. Check review distribution by facility
SELECT f.name as facility_name, COUNT(r.id) as review_count, AVG(r.rating) as avg_rating
FROM facilities f 
LEFT JOIN reviews r ON f.id = r."facilityId"
WHERE f.status = 'APPROVED'
GROUP BY f.id, f.name
ORDER BY review_count DESC;