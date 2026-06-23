CREATE DATABASE IF NOT EXISTS bizvision_ai;
USE bizvision_ai;

-- 1. Business Ideas Table
CREATE TABLE IF NOT EXISTS business_ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_text TEXT NOT NULL,
    location VARCHAR(100) NULL,
    industry VARCHAR(100) NULL,
    business_type VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. API Snapshots Table
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

-- 3. Analysis Reports Table
CREATE TABLE IF NOT EXISTS analysis_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    snapshot_id INT NOT NULL,
    report_json JSON NOT NULL,
    report_version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_reports_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE,
    CONSTRAINT fk_analysis_reports_snapshot FOREIGN KEY (snapshot_id) REFERENCES api_snapshots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Prompt Logs Table
CREATE TABLE IF NOT EXISTS prompt_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_name VARCHAR(100) NOT NULL,
    prompt_text LONGTEXT NULL,
    response_text LONGTEXT NULL,
    model_used VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for optimal performance
CREATE INDEX idx_business_ideas_created ON business_ideas(created_at);
CREATE INDEX idx_api_snapshots_idea ON api_snapshots(idea_id);
CREATE INDEX idx_analysis_reports_idea ON analysis_reports(idea_id);
CREATE INDEX idx_analysis_reports_snapshot ON analysis_reports(snapshot_id);
CREATE INDEX idx_prompt_logs_name ON prompt_logs(prompt_name);
