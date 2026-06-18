import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import init_db, check_db_health
from routes import routes_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── ANSI colours ─────────────────────────────────────────────────────────────
G, R, Y, C, B, X = "\033[92m", "\033[91m", "\033[93m", "\033[96m", "\033[1m", "\033[0m"


def _check(label, ok, detail=""):
    sym  = f"{G}[OK]{X}"   if ok else f"{R}[FAIL]{X}"
    tail = (f"  {C}({detail}){X}" if detail and ok else f"  {Y}({detail}){X}" if detail else "")
    print(f"  {sym}  {label}{tail}")
    return ok


def startup_checks() -> bool:
    """Print diagnostic banner. Returns True when all critical services are ready."""
    print()
    print(f"{B}{'-'*46}{X}")
    print(f"{B}       BizVision AI  —  Startup Diagnostics     {X}")
    print(f"{B}{'-'*46}{X}")

    mysql_ok = check_db_health()
    _check(f"MySQL  ->  {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}", mysql_ok,
           "check DB_HOST / DB_PASSWORD in .env" if not mysql_ok else "")

    serp_ok = bool(Config.SERPAPI_KEY and Config.SERPAPI_KEY != "YOUR_SERPAPI_KEY_HERE")
    _check("SerpAPI Key", serp_ok,
           "add SERPAPI_KEY to .env  ->  serpapi.com" if not serp_ok else "")

    groq_ok = bool(Config.GROQ_API_KEY and Config.GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE")
    _check("Groq API Key  (primary LLM)", groq_ok,
           "add GROQ_API_KEY to .env  ->  console.groq.com" if not groq_ok else "llama-3.3-70b-versatile ready")

    gem_ok = bool(Config.GEMINI_API_KEY and Config.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    _check("Gemini API Key  (LLM fallback)", gem_ok,
           "add GEMINI_API_KEY to .env  ->  aistudio.google.com" if not gem_ok else "gemini-2.5-flash ready")

    print(f"{B}{'-'*46}{X}")

    if not mysql_ok:
        print(f"\n{R}{B}  [FATAL]  MySQL unavailable — server cannot start without a database.{X}\n")
        return False

    llm_ok = groq_ok or gem_ok
    if not serp_ok:
        print(f"\n{Y}{B}  [WARN]  No SerpAPI key — market/competitor data will use fallback values.{X}")
    if not llm_ok:
        print(f"\n{Y}{B}  [WARN]  No LLM key — AI consulting text will use simulated fallback reports.{X}")
    if serp_ok and llm_ok:
        print(f"\n{G}{B}  All systems operational. BizVision AI is ready.{X}\n")
    return True


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "*"}})
    app.register_blueprint(routes_bp)

    # DB schema bootstrap
    try:
        init_db()
        logger.info("Database schema ready.")
    except Exception as exc:
        logger.error(f"Database init failed: {exc}")

    # Global unhandled exception → JSON (never expose raw stack traces to clients)
    @app.errorhandler(Exception)
    def handle_exception(exc):
        logger.exception("Unhandled exception in request")
        return jsonify({"error": "An unexpected server error occurred. Please try again."}), 500

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify({"error": "Method not allowed"}), 405

    return app


app = create_app()


if __name__ == "__main__":
    if not startup_checks():
        sys.exit(1)
    logger.info("BizVision AI backend starting on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
