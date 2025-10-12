-- Create pledges and user_pledges tables
-- This replaces the JSON file storage with proper database storage

-- =====================================================================
-- 1. Create pledges table (master list of all available pledges)
-- =====================================================================
CREATE TABLE IF NOT EXISTS pledges (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    impact_kg_per_year INTEGER DEFAULT 0,
    difficulty VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_pledges_category ON pledges(category);

-- Add comments
COMMENT ON TABLE pledges IS 'Master list of all available pledges that users can commit to';
COMMENT ON COLUMN pledges.id IS 'Unique identifier for the pledge (kebab-case)';
COMMENT ON COLUMN pledges.title IS 'Human-readable title of the pledge';
COMMENT ON COLUMN pledges.category IS 'Category: TRANSPORT, ENERGY, FOOD, WATER, WASTE, etc.';
COMMENT ON COLUMN pledges.description IS 'Detailed description of the pledge';
COMMENT ON COLUMN pledges.impact_kg_per_year IS 'Estimated CO2 reduction in kg per person per year';
COMMENT ON COLUMN pledges.difficulty IS 'Difficulty level: easy, medium, hard';

-- Insert common pledges based on the JSON data and pledge impacts
INSERT INTO pledges (id, title, category, impact_kg_per_year, difficulty, description)
VALUES 
    -- Energy pledges
    ('led-bulbs', 'Switch to LED Bulbs', 'ENERGY', 300, 'easy', 'Replace traditional bulbs with energy-efficient LED bulbs'),
    ('switch-to-green-energy', 'Switch to Green Energy', 'ENERGY', 1200, 'medium', 'Switch to a renewable energy provider for your home'),
    
    -- Water pledges
    ('water-bottle', 'Use Reusable Water Bottle', 'WATER', 180, 'easy', 'Switch from single-use plastic bottles to a reusable water bottle'),
    
    -- Waste pledges
    ('reusable-bag', 'Bring Reusable Bag', 'WASTE', 250, 'easy', 'Always bring reusable bags when shopping'),
    ('avoid-single-use-items', 'Avoid Single-Use Items', 'WASTE', 400, 'medium', 'Reduce consumption of single-use plastics and disposables'),
    
    -- Food pledges
    ('meatless-monday', 'Try Meatless Mondays', 'FOOD', 600, 'easy', 'Go vegetarian every Monday to reduce carbon footprint'),
    ('reduce-meat-intake', 'Reduce Meat Intake', 'FOOD', 750, 'medium', 'Reduce your overall meat consumption throughout the week'),
    
    -- Transport pledges
    ('swap-one-car-trip', 'Swap One Car Trip per Week', 'TRANSPORT', 520, 'easy', 'Replace at least one car trip per week with walking, cycling, or public transport'),
    
    -- Financial pledges
    ('review-green-banking', 'Review Green Banking Options', 'FINANCIAL', 200, 'medium', 'Switch to a bank that invests in sustainable projects')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    impact_kg_per_year = EXCLUDED.impact_kg_per_year,
    difficulty = EXCLUDED.difficulty,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================================
-- 2. Create user_pledges table (tracks which users made which pledges)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_pledges (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    pledge_id VARCHAR(255) NOT NULL,
    reminder_type VARCHAR(50),
    custom_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_pledge FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_pledges_user_id ON user_pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pledges_pledge_id ON user_pledges(pledge_id);
CREATE INDEX IF NOT EXISTS idx_user_pledges_created_at ON user_pledges(created_at);

-- Add comments
COMMENT ON TABLE user_pledges IS 'Stores user pledge commitments and tracking data';
COMMENT ON COLUMN user_pledges.id IS 'Unique identifier for the user pledge';
COMMENT ON COLUMN user_pledges.user_id IS 'UUID of the user who made the pledge';
COMMENT ON COLUMN user_pledges.pledge_id IS 'ID of the pledge from pledges table';
COMMENT ON COLUMN user_pledges.reminder_type IS 'Type of reminder: daily, weekly, custom';
COMMENT ON COLUMN user_pledges.custom_date IS 'Custom reminder date if reminder_type is custom';
COMMENT ON COLUMN user_pledges.created_at IS 'When the pledge was created';
COMMENT ON COLUMN user_pledges.completed_at IS 'When the pledge was completed (NULL if ongoing)';

-- =====================================================================
-- 3. Migrate data from JSON file to database
-- =====================================================================

-- User: test-user-uuid-1
INSERT INTO user_pledges (id, user_id, pledge_id, reminder_type, custom_date, created_at)
VALUES 
    ('7da8c116-26a2-424c-b392-8c138a5c423b', 'test-user-uuid-1', 'reusable-bag', 'weekly', NULL, '2025-09-18 12:59:03.747')
ON CONFLICT (id) DO NOTHING;

-- User: beb87403-62a9-41c8-add9-ccfff145e621
INSERT INTO user_pledges (id, user_id, pledge_id, reminder_type, custom_date, created_at)
VALUES 
    ('38c48928-5697-4c0d-8e7b-dad955bb68e4', 'beb87403-62a9-41c8-add9-ccfff145e621', 'led-bulbs', 'daily', NULL, '2025-09-22 11:28:40.754'),
    ('d25ac45d-e2a3-4f41-baa1-0d7887a21e5f', 'beb87403-62a9-41c8-add9-ccfff145e621', 'water-bottle', 'custom', '2025-09-23', '2025-09-23 13:18:35.174'),
    ('ed7824a0-a75b-4751-becd-ffe5bfd1d6c9', 'beb87403-62a9-41c8-add9-ccfff145e621', 'reusable-bag', 'custom', NULL, '2025-10-07 01:33:08.887'),
    ('b8a437cd-acc1-47ea-8c4f-1be25f13abb4', 'beb87403-62a9-41c8-add9-ccfff145e621', 'meatless-monday', 'daily', NULL, '2025-10-07 01:33:08.887'),
    ('65c82b92-5b8d-4a26-a739-e0e6f38e1b22', 'beb87403-62a9-41c8-add9-ccfff145e621', 'reduce-meat-intake', 'daily', NULL, '2025-10-10 10:27:59.344'),
    ('97c8d06a-a468-4165-bbf3-c4cae908c22d', 'beb87403-62a9-41c8-add9-ccfff145e621', 'switch-to-green-energy', 'daily', NULL, '2025-10-10 10:27:59.344'),
    ('c5a6723e-0f6a-4341-8494-a7ee2301825f', 'beb87403-62a9-41c8-add9-ccfff145e621', 'swap-one-car-trip', 'daily', NULL, '2025-10-10 10:27:59.344'),
    ('4e9ae1e7-5cea-4782-bc48-777469255ea0', 'beb87403-62a9-41c8-add9-ccfff145e621', 'review-green-banking', 'daily', NULL, '2025-10-10 10:27:59.344'),
    ('fad45602-b5f6-4553-8bd9-e15dc1dd67e5', 'beb87403-62a9-41c8-add9-ccfff145e621', 'avoid-single-use-items', 'daily', NULL, '2025-10-10 10:27:59.344')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 4. Verify data migration
-- =====================================================================
SELECT 
    'Pledges' as table_name,
    COUNT(*) as row_count 
FROM pledges
UNION ALL
SELECT 
    'User Pledges' as table_name,
    COUNT(*) as row_count 
FROM user_pledges;

SELECT 
    user_id, 
    COUNT(*) as pledge_count 
FROM user_pledges 
GROUP BY user_id
ORDER BY pledge_count DESC;

SELECT 
    p.category,
    COUNT(up.id) as user_pledge_count
FROM pledges p
LEFT JOIN user_pledges up ON p.id = up.pledge_id
GROUP BY p.category
ORDER BY user_pledge_count DESC;

