import mysql.connector
from mysql.connector import Error
import os
import logging
from urllib.parse import urlparse, parse_qs
from config import Config

logger = logging.getLogger(__name__)


def get_db_connection():
    """Establish a connection to the Aiven MySQL database using Config.DATABASE_URL.
    
    Raises:
        ValueError: If DATABASE_URL is not configured.
        mysql.connector.Error: If the connection attempt fails.
    """
    if not Config.DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is missing or empty in .env.")

    try:
        parsed = urlparse(Config.DATABASE_URL)
        connection_args = {
            "host": parsed.hostname,
            "port": parsed.port or 3306,
            "user": parsed.username,
            "password": parsed.password or "",
            "database": parsed.path.lstrip("/") if parsed.path else Config.DB_NAME,
            "connect_timeout": 5,
        }
        
        if parsed.query:
            params = parse_qs(parsed.query)
            ssl_mode = params.get("sslmode", params.get("ssl-mode", [""]))[0].lower()
            if ssl_mode in ("require", "required"):
                connection_args["ssl_disabled"] = False
            if params.get("ssl_ca"):
                connection_args["ssl_ca"] = params["ssl_ca"][0]
                
        conn = mysql.connector.connect(**connection_args)
        logger.debug("Database connected successfully.")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to MySQL database: {e}")
        raise


def check_db_health() -> bool:
    """Verify Aiven MySQL database connectivity and the presence of core tables.
    
    Returns:
        bool: True if the database is reachable and required tables exist, False otherwise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify core tables exist by selecting from them
        cursor.execute("SELECT 1 FROM business_ideas LIMIT 1")
        cursor.fetchone()
        cursor.execute("SELECT 1 FROM analysis_reports LIMIT 1")
        cursor.fetchone()
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False


def init_db() -> None:
    """Initialize Aiven MySQL database schema using the queries in schema.sql.
    
    Raises:
        FileNotFoundError: If schema.sql is not found in the backend directory.
        Exception: On any database connection or execution failure.
    """
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"schema.sql not found at {schema_path}")

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for statement in schema_sql.split(";"):
            # Strip SQL comments line by line
            clean_lines = [
                line.split("--")[0].strip()
                for line in statement.split("\n")
                if line.split("--")[0].strip()
            ]
            exec_stmt = " ".join(clean_lines).strip()
            if not exec_stmt:
                continue

            # Skip database creation/switching statements since database is pre-created on Aiven
            upper_stmt = exec_stmt.upper()
            if upper_stmt.startswith("CREATE DATABASE") or upper_stmt.startswith("USE "):
                continue

            try:
                cursor.execute(exec_stmt)
            except Error as e:
                # Ignore already-exists errors safely (warnings)
                if "Duplicate key name" in str(e) or "already exists" in str(e).lower() or "Duplicate entry" in str(e):
                    continue
                logger.warning(f"Schema statement warning: {e} | Query: {exec_stmt[:80]}")
                
        conn.commit()
        logger.info("Schema initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def execute_query(
    query: str,
    params: tuple | list | dict | None = None,
    fetch: str | None = None,
    commit: bool = False
) -> any:
    """Execute an SQL query against the Aiven MySQL database.
    
    Args:
        query: The SQL query to be executed.
        params: The parameters to bind to the query.
        fetch: Options: 'one' (returns a dict) or 'all' (returns a list of dicts).
        commit: If True, commits transaction and returns lastrowid / rowcount.
        
    Returns:
        The fetched result, lastrowid, rowcount, or None.
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
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
            else:
                result = None
        return result
    except Exception as e:
        logger.error(f"Database query failed: {e} | Query: {query[:120]} | Params: {params}")
        if conn and commit:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
