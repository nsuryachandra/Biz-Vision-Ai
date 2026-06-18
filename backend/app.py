import sys
import logging
from flask import Flask
from flask_cors import CORS
from config import Config
from db import init_db, check_db_health, get_db_connection
from routes import routes_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── ANSI colours for terminal ────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


def _check(label, ok, detail=""):
    tick  = f"{GREEN}[OK]{RESET}"
    cross = f"{RED}[FAIL]{RESET}"
    sym   = tick if ok else cross
    tail  = f"  {YELLOW}({detail}){RESET}" if detail and not ok else (f"  {CYAN}({detail}){RESET}" if detail else "")
    print(f"  {sym}  {label}{tail}")
    return ok


def startup_checks():
    """Print a boot status banner to the console."""
    print()
    print(f"{BOLD}{'-' * 46}{RESET}")
    print(f"{BOLD}       BizVision AI  -  Startup Diagnostics     {RESET}")
    print(f"{BOLD}{'-' * 46}{RESET}")

    # 1. MySQL
    mysql_ok = check_db_health()
    _check(
        f"MySQL  ->  {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}",
        mysql_ok,
        "add DB_PASSWORD to .env" if not mysql_ok else "",
    )

    # 2. SerpAPI key
    serp_ok = bool(Config.SERPAPI_KEY and Config.SERPAPI_KEY not in ("", "YOUR_SERPAPI_KEY_HERE"))
    _check(
        "SerpAPI Key",
        serp_ok,
        "add SERPAPI_KEY to .env  ->  serpapi.com" if not serp_ok else "",
    )

    # 3. LLM API Key (Groq or Gemini)
    groq_ok = bool(Config.GROQ_API_KEY and Config.GROQ_API_KEY not in ("", "YOUR_GROQ_API_KEY_HERE"))
    gem_ok = bool(Config.GEMINI_API_KEY and Config.GEMINI_API_KEY not in ("", "YOUR_GEMINI_API_KEY_HERE"))
    llm_ok = groq_ok or gem_ok
    
    _check(
        "Groq API Key",
        groq_ok,
        "add GROQ_API_KEY to .env  ->  console.groq.com" if not groq_ok else "Primary client ready",
    )
    _check(
        "Gemini API Key",
        gem_ok,
        "add GEMINI_API_KEY to .env  ->  aistudio.google.com" if not gem_ok else "Secondary fallback ready",
    )

    print(f"{BOLD}{'-' * 46}{RESET}")

    if not mysql_ok:
        print(f"\n{RED}{BOLD}  [FAIL]  MySQL is required. Update .env and restart.{RESET}\n")
    if not serp_ok or not llm_ok:
        print(f"\n{YELLOW}{BOLD}  [WARNING]  Missing API keys - /analyze endpoint will return 503.{RESET}\n")
    else:
        print(f"\n{GREEN}{BOLD}  All systems operational. Starting server...{RESET}\n")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
    )

    app.register_blueprint(routes_bp)

    try:
        init_db()
        logger.info("Database schema ready.")
    except Exception as e:
        logger.error(f"Database init failed: {e}")

    return app


app = create_app()

if __name__ == "__main__":
    startup_checks()
    logger.info("BizVision AI backend listening on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
