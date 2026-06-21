import mysql.connector
from mysql.connector import Error
import sqlite3
import os
import logging
from urllib.parse import urlparse, parse_qs
from config import Config

logger = logging.getLogger(__name__)

# Global flag to track if we should fall back to SQLite
USE_SQLITE = False
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "local_db.sqlite")


def get_db_connection(include_db=True):
    """Establish a connection to MySQL (supports DATABASE_URL for Aiven cloud) or SQLite fallback."""
    global USE_SQLITE
    if USE_SQLITE:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    try:
        if Config.DATABASE_URL:
            parsed = urlparse(Config.DATABASE_URL)
            connection_args = {
                "host": parsed.hostname,
                "port": parsed.port or 3306,
                "user": parsed.username,
                "password": parsed.password or "",
                "connect_timeout": 3,
            }
            db_name = parsed.path.lstrip("/") if parsed.path else Config.DB_NAME
            if include_db:
                connection_args["database"] = db_name
            if parsed.query:
                params = parse_qs(parsed.query)
                ssl_mode = params.get("sslmode", params.get("ssl-mode", [""]))[0].lower()
                if ssl_mode == "require" or ssl_mode == "required":
                    connection_args["ssl_disabled"] = False
                if params.get("ssl_ca"):
                    connection_args["ssl_ca"] = params["ssl_ca"][0]
        else:
            connection_args = {
                "host": Config.DB_HOST,
                "port": Config.DB_PORT,
                "user": Config.DB_USER,
                "password": Config.DB_PASSWORD,
                "connect_timeout": 3,
            }
            if include_db:
                connection_args["database"] = Config.DB_NAME
        return mysql.connector.connect(**connection_args)
    except Exception as e:
        logger.warning(f"Failed to connect to MySQL ({e}). Falling back to SQLite database at: {SQLITE_DB_PATH}")
        USE_SQLITE = True
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def check_db_health():
    """Returns True if database (MySQL or SQLite) is reachable and required tables exist."""
    try:
        conn = get_db_connection(include_db=True)
        cursor = conn.cursor()
        
        if USE_SQLITE:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='business_ideas'")
            row1 = cursor.fetchone()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='analysis_reports'")
            row2 = cursor.fetchone()
            cursor.close()
            conn.close()
            return bool(row1 and row2)
        else:
            # Verify core tables exist by selecting from them
            cursor.execute("SELECT 1 FROM business_ideas LIMIT 1")
            cursor.fetchone()
            cursor.execute("SELECT 1 FROM analysis_reports LIMIT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            return True
    except Exception:
        if USE_SQLITE:
            try:
                init_db()
                return True
            except Exception:
                return False
        return False


def init_db():
    """Create database and tables from schema.sql or SQLite schema fallback. Raises on failure."""
    global USE_SQLITE
    # Pre-trigger connection test to update USE_SQLITE if MySQL is down
    if not USE_SQLITE:
        try:
            conn = get_db_connection(include_db=False)
            conn.close()
        except Exception:
            pass

    if USE_SQLITE:
        logger.info(f"Initializing SQLite schema in {SQLITE_DB_PATH}...")
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        # SQLite-compatible schemas
        schemas = [
            """CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS business_ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                idea_text TEXT NOT NULL,
                keywords TEXT NULL,
                location TEXT NULL,
                industry TEXT NULL,
                business_type TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )""",
            """CREATE TABLE IF NOT EXISTS competitor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idea_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                rating REAL NULL,
                review_count INTEGER NULL,
                address TEXT NULL,
                reviews TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS trend_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idea_id INTEGER NOT NULL,
                query TEXT NOT NULL,
                date_points TEXT NOT NULL,
                growth_rate REAL NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS news_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idea_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                source TEXT NULL,
                url TEXT NULL,
                sentiment TEXT NULL,
                published_date TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS analysis_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idea_id INTEGER NOT NULL,
                demand_score INTEGER NOT NULL,
                trend_score INTEGER NOT NULL,
                competition_score INTEGER NOT NULL,
                sentiment_score INTEGER NOT NULL,
                opportunity_score INTEGER NOT NULL,
                risk_score INTEGER NOT NULL,
                viability_score INTEGER NOT NULL,
                executive_summary TEXT NULL,
                market_analysis TEXT NULL,
                competitor_analysis TEXT NULL,
                trend_analysis TEXT NULL,
                risk_analysis TEXT NULL,
                opportunity_analysis TEXT NULL,
                name_validation TEXT NULL,
                final_recommendation TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                idea_id INTEGER NOT NULL,
                query TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS api_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_name TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                status_code INTEGER NULL,
                response_summary TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS prompt_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_name TEXT NOT NULL,
                input_variables TEXT NULL,
                prompt_text TEXT NULL,
                response_text TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            # Indexes
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_business_ideas_user ON business_ideas(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_competitor_data_idea ON competitor_data(idea_id)",
            "CREATE INDEX IF NOT EXISTS idx_trend_data_idea ON trend_data(idea_id)",
            "CREATE INDEX IF NOT EXISTS idx_news_data_idea ON news_data(idea_id)",
            "CREATE INDEX IF NOT EXISTS idx_analysis_reports_idea ON analysis_reports(idea_id)",
            "CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_search_history_idea ON search_history(idea_id)",
            "CREATE INDEX IF NOT EXISTS idx_api_logs_name ON api_logs(api_name)",
            "CREATE INDEX IF NOT EXISTS idx_prompt_logs_name ON prompt_logs(prompt_name)"
        ]
        
        for statement in schemas:
            cursor.execute(statement)
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("SQLite database schema initialized successfully.")
        return

    # Step 1: create database if it doesn't exist (skip for Aiven cloud — avnadmin may not have CREATE privilege)
    if not Config.DATABASE_URL:
        conn = get_db_connection(include_db=False)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}`")
        conn.commit()
        cursor.close()
        conn.close()

    # Step 2: run schema
    conn = get_db_connection(include_db=True)
    cursor = conn.cursor()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    if not os.path.exists(schema_path):
        raise FileNotFoundError("schema.sql not found.")

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    for statement in schema_sql.split(";"):
        # Strip comments line by line
        clean_lines = []
        for line in statement.split("\n"):
            clean_line = line.split("--")[0].strip()
            if clean_line:
                clean_lines.append(clean_line)
        
        exec_stmt = " ".join(clean_lines).strip()
        if not exec_stmt:
            continue

        # Skip CREATE DATABASE and USE for Aiven cloud — the URL already specifies the DB
        if Config.DATABASE_URL:
            upper = exec_stmt.upper()
            if upper.startswith("CREATE DATABASE") or upper.startswith("USE "):
                continue

        try:
            cursor.execute(exec_stmt)
        except Error as e:
            if "Duplicate key name" in str(e) or "already exists" in str(e).lower() or "Duplicate entry" in str(e):
                continue
            logger.warning(f"Schema warning: {e} | Query: {exec_stmt[:80]}")
    conn.commit()
    cursor.close()
    conn.close()
    logger.info("Database schema initialized successfully.")


def execute_query(query, params=None, fetch=None, commit=False):
    """Execute a raw SQL query. Raises on any error."""
    global USE_SQLITE
    conn = None
    cursor = None
    result = None
    try:
        conn = get_db_connection()
        if USE_SQLITE:
            query = query.replace("%s", "?")
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            
            if commit:
                conn.commit()
                result = cursor.lastrowid if query.strip().upper().startswith("INSERT") else cursor.rowcount
            else:
                if fetch == "one":
                    row = cursor.fetchone()
                    result = dict(row) if row else None
                elif fetch == "all":
                    rows = cursor.fetchall()
                    result = [dict(row) for row in rows]
        else:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())

            if commit:
                conn.commit()
                result = cursor.lastrowid if query.strip().upper().startswith("INSERT") else cursor.rowcount
            else:
                if fetch == "one":
                    result = cursor.fetchone()
                elif fetch == "all":
                    result = cursor.fetchall()
    except Exception as e:
        logger.error(f"Database Error: {e} | Query: {query[:120]} | Params: {params}")
        if conn and commit:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    return result

