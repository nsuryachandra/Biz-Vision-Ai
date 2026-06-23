import os
import sys
import logging
from mysql.connector import Error

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("migration")

def run_migration():
    logger.info("Starting database migration to 4 core tables...")
    
    migration_path = os.path.join(os.path.dirname(__file__), "migration.sql")
    if not os.path.exists(migration_path):
        logger.error(f"migration.sql not found at {migration_path}")
        sys.exit(1)

    with open(migration_path, "r", encoding="utf-8") as f:
        migration_sql = f.read()

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Split statements by semicolon
    statements = migration_sql.split(";")
    
    for i, statement in enumerate(statements, 1):
        # Strip comments
        lines = statement.split("\n")
        clean_lines = []
        for line in lines:
            if line.strip().startswith("--"):
                continue
            clean_lines.append(line.split("--")[0].strip())
        
        exec_stmt = " ".join(clean_lines).strip()
        if not exec_stmt:
            continue

        logger.info(f"Executing statement {i}/{len(statements)}: {exec_stmt[:80]}...")
        try:
            cursor.execute(exec_stmt)
            conn.commit()
            logger.info("Statement executed successfully.")
        except Error as e:
            # Safe ignores during migrations (e.g. if column or FK already dropped/exists)
            err_msg = str(e).lower()
            ignore_errors = [
                "duplicate column name",
                "key/column doesn't exist",
                "check that column/key exists",
                "unknown column",
                "can't drop",
                "duplicate key name",
                "already exists",
                "foreign key constraint is incorrectly formed",
                "cannot drop index",
                "duplicate entry",
                "duplicate foreign key"
            ]
            if any(msg in err_msg for msg in ignore_errors):
                logger.info(f"Notice: Ignored expected warning/error: {e}")
                conn.rollback()
            else:
                logger.error(f"Migration statement failed: {e}")
                conn.rollback()
                # Stop if it is a critical failure
                cursor.close()
                conn.close()
                sys.exit(1)

    cursor.close()
    conn.close()
    logger.info("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
