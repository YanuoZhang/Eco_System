-- Create completed_pledges table to track completed pledges
-- This allows users to see their achievement history

-- =====================================================================
-- 1. Create completed_pledges table
-- =====================================================================
CREATE TABLE IF NOT EXISTS completed_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    pledge_id VARCHAR(255) NOT NULL,
    pledge_type VARCHAR(20) NOT NULL, -- 'public' or 'ai_suggestion'
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    icon VARCHAR(10),
    benefit TEXT,
    impact VARCHAR(20),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    original_record_id UUID, -- Reference to user_pledges.id for public pledges
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_completed_pledge FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_completed_pledges_user_id ON completed_pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_pledges_completed_at ON completed_pledges(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_pledges_pledge_type ON completed_pledges(pledge_type);

-- Add comments
COMMENT ON TABLE completed_pledges IS 'Stores completed pledges for user achievement tracking';
COMMENT ON COLUMN completed_pledges.id IS 'Unique identifier for the completed pledge record';
COMMENT ON COLUMN completed_pledges.user_id IS 'UUID of the user who completed the pledge';
COMMENT ON COLUMN completed_pledges.pledge_id IS 'ID of the pledge from pledges table (for public pledges) or generated ID (for AI suggestions)';
COMMENT ON COLUMN completed_pledges.pledge_type IS 'Type of pledge: public (from master list) or ai_suggestion (AI generated)';
COMMENT ON COLUMN completed_pledges.title IS 'Title of the completed pledge';
COMMENT ON COLUMN completed_pledges.category IS 'Category of the pledge';
COMMENT ON COLUMN completed_pledges.icon IS 'Icon/emoji for the pledge';
COMMENT ON COLUMN completed_pledges.benefit IS 'Description of the benefit';
COMMENT ON COLUMN completed_pledges.impact IS 'Impact level: small, medium, large';
COMMENT ON COLUMN completed_pledges.completed_at IS 'When the pledge was completed';
COMMENT ON COLUMN completed_pledges.original_record_id IS 'Reference to user_pledges.id for public pledges (NULL for AI suggestions)';

-- =====================================================================
-- 2. Add some sample completed pledges for testing
-- =====================================================================
INSERT INTO completed_pledges (user_id, pledge_id, pledge_type, title, category, icon, benefit, impact, original_record_id)
VALUES 
    ('beb87403-62a9-41c8-add9-ccfff145e621', 'led-bulbs', 'public', 'Switch to LED Bulbs', 'energy', '💡', 'Cut lighting energy by 75%', 'large', 'd25ac45d-e2a3-4f41-baa1-0d7887a21e5f'),
    ('beb87403-62a9-41c8-add9-ccfff145e621', 'water-bottle', 'public', 'Use Reusable Water Bottle', 'water', '💧', 'Save 180kg CO₂ per year', 'small', 'd25ac45d-e2a3-4f41-baa1-0d7887a21e5f')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 3. Verify table creation
-- =====================================================================
SELECT 
    'Completed Pledges' as table_name,
    COUNT(*) as row_count 
FROM completed_pledges;

-- Show completed pledges by user
SELECT 
    user_id, 
    COUNT(*) as completed_count,
    MAX(completed_at) as last_completed
FROM completed_pledges 
GROUP BY user_id
ORDER BY completed_count DESC;

