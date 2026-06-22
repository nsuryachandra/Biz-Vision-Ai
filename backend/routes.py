import json
import logging
from flask import Blueprint, request, jsonify
from db import execute_query, check_db_health
from market_intelligence_service import MarketIntelligenceService
from config import Config

logger = logging.getLogger(__name__)
routes_bp = Blueprint("routes", __name__)

# Initialize the central Market Intelligence Service
try:
    market_service = MarketIntelligenceService()
except Exception as e:
    logger.exception("Failed to initialize MarketIntelligenceService:")
    market_service = None

@routes_bp.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "BizVision AI — Real Business Intelligence API",
        "version": "3.0.0",
    })

@routes_bp.route("/health", methods=["GET"])
def health():
    db_ok = check_db_health()
    return jsonify({
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "serpapi": bool(Config.SERPAPI_KEY),
        "groq": bool(Config.GROQ_API_KEY),
        "gemini": bool(Config.GEMINI_API_KEY),
    }), 200 if db_ok else 503

@routes_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Perform a complete market intelligence analysis.
    Calls MarketIntelligenceService to aggregate SerpAPI data, execute LLM evaluation,
    and persist results.
    """
    if not market_service:
        return jsonify({"error": "MarketIntelligenceService is unavailable."}), 503

    body = request.get_json(silent=True) or {}
    idea_text = (body.get("idea_text") or "").strip()
    user_id = body.get("user_id")

    if not idea_text:
        return jsonify({"error": "idea_text is required and must not be empty."}), 400

    try:
        result = market_service.analyze_idea(idea_text, user_id)
        return jsonify({
            "report_id": result["report_id"],
            "idea_id": result["idea_id"],
            "metadata": result["metadata"],
            "report": result["report"],
            "competitors": result["competitors"],
            "trends": result["trends"],
            "news": result["news"],
            "shopping": result["shopping"]
        }), 201
    except Exception as exc:
        logger.exception("Analysis pipeline failed:")
        return jsonify({"error": f"Analysis failed: {exc}"}), 500

@routes_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """
    Retrieve platform analytics statistics and lists of recent reports.
    Aggregates metrics from stored report JSON blocks.
    """
    try:
        # Fetch recent report headers
        recent = execute_query(
            """SELECT
                ar.id AS report_id,
                ar.report_json,
                bi.idea_text, bi.location, bi.industry,
                ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC LIMIT 10""",
            fetch="all"
        )

        total_ideas = 0
        approved_pilots = 0
        pivots_recommended = 0
        not_feasible = 0

        # Calculate metrics from all reports
        all_reports = execute_query("SELECT report_json FROM analysis_reports", fetch="all") or []
        total_ideas = len(all_reports)

        for r in all_reports:
            try:
                data = json.loads(r["report_json"])
                status = data.get("executive_verdict", {}).get("verdict_status", "").lower()
                if "approved" in status:
                    approved_pilots += 1
                elif "pivot" in status or "caution" in status:
                    pivots_recommended += 1
                else:
                    not_feasible += 1
            except Exception:
                pass

        # Formatting recent report payloads for API response
        formatted_recent = []
        for row in recent:
            created = row.get("created_at")
            if created:
                row["created_at"] = created if isinstance(created, str) else created.isoformat()
            
            try:
                report_data = json.loads(row["report_json"])
                row["verdict_status"] = report_data.get("executive_verdict", {}).get("verdict_status", "Unknown")
                row["title"] = report_data.get("hero_summary", {}).get("title", "Market Report")
                row["grade"] = report_data.get("final_recommendation", {}).get("overall_score_equivalent", "-")
            except Exception:
                row["verdict_status"] = "Unknown"
                row["title"] = "Market Report"
                row["grade"] = "-"

            if "report_json" in row:
                del row["report_json"]
            formatted_recent.append(row)

        return jsonify({
            "metrics": {
                "total_ideas_analyzed": total_ideas,
                "approved_pilots_count": approved_pilots,
                "pivots_recommended_count": pivots_recommended,
                "not_feasible_count": not_feasible,
            },
            "recent_reports": formatted_recent
        })
    except Exception as exc:
        logger.exception("Dashboard metrics fetch failed:")
        return jsonify({"error": str(exc)}), 500

@routes_bp.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    """Retrieve the full compiled intelligence report by ID."""
    try:
        report = execute_query(
            "SELECT * FROM analysis_reports WHERE id = %s", (report_id,), fetch="one"
        )
        if not report:
            return jsonify({"error": "Report not found"}), 404

        idea = execute_query(
            "SELECT * FROM business_ideas WHERE id = %s", (report["idea_id"],), fetch="one"
        )
        if not idea:
            return jsonify({"error": "Associated business idea not found"}), 404

        competitors = execute_query(
            """SELECT name AS title, rating,
                      review_count AS reviews, address,
                      reviews      AS reviews_list
               FROM competitor_data WHERE idea_id = %s""",
            (report["idea_id"],),
            fetch="all"
        )
        for c in competitors:
            try:
                c["reviews_list"] = json.loads(c["reviews_list"]) if c.get("reviews_list") else []
            except Exception:
                c["reviews_list"] = []

        trend_row = execute_query(
            "SELECT date_points, growth_rate FROM trend_data WHERE idea_id = %s",
            (report["idea_id"],),
            fetch="one"
        )
        trend_timeline = []
        if trend_row:
            try:
                trend_timeline = json.loads(trend_row["date_points"])
            except Exception:
                trend_timeline = []

        news = execute_query(
            """SELECT title, source,
                      url            AS link,
                      sentiment      AS sentiment_hint,
                      published_date AS date
               FROM news_data WHERE idea_id = %s""",
            (report["idea_id"],),
            fetch="all"
        )

        shopping = execute_query(
            """SELECT title, price, source, rating, reviews, thumbnail
               FROM shopping_data WHERE idea_id = %s""",
            (report["idea_id"],),
            fetch="all"
        )

        try:
            report_data = json.loads(report["report_json"])
        except Exception as e:
            logger.error(f"Failed to parse report_json from database: {e}")
            report_data = {}

        created = report.get("created_at")
        if created:
            report["created_at"] = created if isinstance(created, str) else created.isoformat()

        return jsonify({
            "report_id": report["id"],
            "idea_id": report["idea_id"],
            "created_at": report["created_at"],
            "metadata": {
                "idea_text": idea["idea_text"],
                "keywords": idea["keywords"],
                "location": idea["location"],
                "industry": idea["industry"],
                "business_type": idea["business_type"],
            },
            "report": report_data,
            "competitors": competitors,
            "trends": trend_timeline,
            "news": news,
            "shopping": shopping
        })
    except Exception as exc:
        logger.exception(f"Report fetch failed for id={report_id}:")
        return jsonify({"error": str(exc)}), 500

@routes_bp.route("/history", methods=["GET"])
def history():
    """List all previous analysis runs."""
    try:
        rows = execute_query(
            """SELECT
                ar.id AS report_id,
                ar.report_json,
                bi.idea_text, bi.location, bi.industry,
                ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC""",
            fetch="all"
        )
        
        formatted_history = []
        for row in rows:
            created = row.get("created_at")
            if created:
                row["created_at"] = created if isinstance(created, str) else created.isoformat()
            
            try:
                report_data = json.loads(row["report_json"])
                row["verdict_status"] = report_data.get("executive_verdict", {}).get("verdict_status", "Unknown")
                row["title"] = report_data.get("hero_summary", {}).get("title", "Market Report")
                row["grade"] = report_data.get("final_recommendation", {}).get("overall_score_equivalent", "-")
            except Exception:
                row["verdict_status"] = "Unknown"
                row["title"] = "Market Report"
                row["grade"] = "-"

            if "report_json" in row:
                del row["report_json"]
            formatted_history.append(row)

        return jsonify(formatted_history)
    except Exception as exc:
        logger.exception("History fetch failed:")
        return jsonify({"error": str(exc)}), 500
