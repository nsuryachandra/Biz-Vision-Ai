CREATE DATABASE IF NOT EXISTS bizvision_ai;
USE bizvision_ai;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Business Ideas Table
CREATE TABLE IF NOT EXISTS business_ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    idea_text TEXT NOT NULL,
    keywords VARCHAR(255) NULL,
    location VARCHAR(100) NULL,
    industry VARCHAR(100) NULL,
    business_type VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_business_ideas_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Competitor Data Table
CREATE TABLE IF NOT EXISTS competitor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    rating DECIMAL(3,2) NULL,
    review_count INT NULL,
    address VARCHAR(255) NULL,
    reviews TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_competitor_data_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Trend Data Table
CREATE TABLE IF NOT EXISTS trend_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    `query` VARCHAR(255) NOT NULL,
    date_points TEXT NOT NULL, -- JSON string representation
    growth_rate DECIMAL(5,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trend_data_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. News Data Table
CREATE TABLE IF NOT EXISTS news_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    source VARCHAR(255) NULL,
    url VARCHAR(500) NULL,
    sentiment VARCHAR(50) NULL, -- positive, negative, neutral
    published_date VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_data_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Analysis Reports Table
CREATE TABLE IF NOT EXISTS analysis_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    demand_score INT NOT NULL,
    trend_score INT NOT NULL,
    competition_score INT NOT NULL,
    sentiment_score INT NOT NULL,
    opportunity_score INT NOT NULL,
    risk_score INT NOT NULL,
    viability_score INT NOT NULL,
    executive_summary TEXT NULL,
    market_analysis TEXT NULL,
    competitor_analysis TEXT NULL,
    trend_analysis TEXT NULL,
    risk_analysis TEXT NULL,
    opportunity_analysis TEXT NULL,
    name_validation TEXT NULL, -- JSON block of name validation results
    final_recommendation TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_reports_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Search History Table
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    idea_id INT NOT NULL,
    `query` TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_search_history_idea FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. API Logs Table
CREATE TABLE IF NOT EXISTS api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NULL,
    response_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Prompt Logs Table
CREATE TABLE IF NOT EXISTS prompt_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_name VARCHAR(100) NOT NULL,
    input_variables LONGTEXT NULL,
    prompt_text LONGTEXT NULL,
    response_text LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for optimal performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_business_ideas_user ON business_ideas(user_id);
CREATE INDEX idx_competitor_data_idea ON competitor_data(idea_id);
CREATE INDEX idx_trend_data_idea ON trend_data(idea_id);
CREATE INDEX idx_news_data_idea ON news_data(idea_id);
CREATE INDEX idx_analysis_reports_idea ON analysis_reports(idea_id);
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_idea ON search_history(idea_id);
CREATE INDEX idx_api_logs_name ON api_logs(api_name);
CREATE INDEX idx_prompt_logs_name ON prompt_logs(prompt_name);
