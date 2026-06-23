-- BizVision AI - Database Migration to 4 Core Tables

-- 1. Create api_snapshots table
CREATE TABLE IF NOT EXISTS api_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    google_search_json JSON NULL,
    google_maps_json JSON NULL,
    google_trends_json JSON NULL,
    google_news_json JSON NULL,
    google_shopping_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_snapshots_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert empty snapshot rows for existing business ideas to satisfy NOT NULL constraints
INSERT INTO api_snapshots (idea_id, google_search_json, google_maps_json, google_trends_json, google_news_json, google_shopping_json)
SELECT id, '{}', '{}', '{}', '{}', '{}' 
FROM business_ideas 
WHERE id NOT IN (SELECT DISTINCT idea_id FROM api_snapshots);

-- 3. Add columns to analysis_reports
ALTER TABLE analysis_reports ADD COLUMN snapshot_id INT NULL AFTER idea_id;
ALTER TABLE analysis_reports ADD COLUMN report_version VARCHAR(50) DEFAULT '1.0.0' AFTER report_json;

-- 4. Map existing analysis reports to their respective snapshots
UPDATE analysis_reports ar
JOIN api_snapshots s ON ar.idea_id = s.idea_id
SET ar.snapshot_id = s.id
WHERE ar.snapshot_id IS NULL;

-- 5. If we have any report with missing snapshot_id (e.g. orphan records), clean them up or make snapshot_id NOT NULL
-- For migration safety, we first set default for remaining NULL snapshot_ids (if any) or delete orphans
DELETE FROM analysis_reports WHERE snapshot_id IS NULL;

ALTER TABLE analysis_reports MODIFY COLUMN snapshot_id INT NOT NULL;

-- Add snapshot FK constraint to analysis_reports
ALTER TABLE analysis_reports ADD CONSTRAINT fk_analysis_reports_snapshot FOREIGN KEY (snapshot_id) REFERENCES api_snapshots(id) ON DELETE CASCADE;

-- 6. Clean up business_ideas columns and foreign keys
ALTER TABLE business_ideas DROP FOREIGN KEY fk_business_ideas_user;
ALTER TABLE business_ideas DROP COLUMN user_id;
ALTER TABLE business_ideas DROP COLUMN keywords;
ALTER TABLE business_ideas DROP COLUMN updated_at;

-- 7. Modify prompt_logs schema
ALTER TABLE prompt_logs DROP COLUMN input_variables;
ALTER TABLE prompt_logs ADD COLUMN model_used VARCHAR(100) NULL AFTER response_text;

-- 8. Drop deprecated tables
DROP TABLE IF EXISTS competitor_data;
DROP TABLE IF EXISTS trend_data;
DROP TABLE IF EXISTS news_data;
DROP TABLE IF EXISTS shopping_data;
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS users;
