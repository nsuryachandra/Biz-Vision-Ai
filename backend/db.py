import mysql.connector
from mysql.connector import Error
import os
import logging
from config import Config

logger = logging.getLogger(__name__)


def get_db_connection(include_db=True):
    """Establish a connection to the MySQL server."""
    connection_args = {
        "host": Config.DB_HOST,
        "port": Config.DB_PORT,
        "user": Config.DB_USER,
        "password": Config.DB_PASSWORD,
        "auth_plugin": "mysql_native_password",
        "connect_timeout": 5,
    }
    if include_db:
        connection_args["database"] = Config.DB_NAME
    return mysql.connector.connect(**connection_args)


def check_db_health():
    """Returns True if MySQL is reachable and the database exists."""
    try:
        conn = get_db_connection(include_db=True)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return True
    except Exception:
        return False


def init_db():
    """Create database and tables from schema.sql. Raises on failure."""
    # Step 1: create database if it doesn't exist
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
        if exec_stmt:
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
    """Execute a raw SQL query against MySQL. Raises on any error."""
    conn = None
    cursor = None
    result = None
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
    except Error as e:
        logger.error(f"SQL Error: {e} | Query: {query[:120]} | Params: {params}")
        if conn and commit:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    return result
