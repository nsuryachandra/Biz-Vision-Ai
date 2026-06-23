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
    idea_text = (body.get("idea_text") or body.get("idea") or "").strip()
    location = (body.get("location") or "").strip()
    user_id = body.get("user_id")

    print(f"\n=== /analyze called ===")
    print(f"  idea_text: '{idea_text}'")
    print(f"  location: '{location}'")
    print(f"  user_id: {user_id}")

    if not idea_text:
        return jsonify({
            "success": False,
            "error": "idea or idea_text is required and must not be empty."
        }), 400

    try:
        print(f"  >>> Calling market_service.analyze_idea()...")
        result = market_service.analyze_idea(idea_text, user_id, location=location or None)
        print(f"  <<< analyze_idea() returned")
        print(f"      success: {result.get('success', True)}")
        print(f"      error: {result.get('error', 'None')}")
        print(f"      report: {'present' if result.get('report') else 'None'}")
        print(f"      report_id: {result.get('report_id')}")
        if isinstance(result, dict) and not result.get("success", True):
            status_code = 400 if "location" in result.get("error", "").lower() else 500
            return jsonify({
                "success": False,
                "error": result.get("error", "AI report generation unavailable")
            }), status_code

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
        avg_investment = 0
        avg_saturation = 0
        avg_risk = 0

        # Calculate metrics from all reports
        all_reports = execute_query("SELECT report_json FROM analysis_reports", fetch="all") or []
        total_ideas = len(all_reports)

        sum_investment = 0
        sum_saturation = 0
        sum_risk = 0
        count_valid = 0

        for r in all_reports:
            try:
                data = json.loads(r["report_json"])
                status = data.get("final_verdict", {}).get("verdict_status") or data.get("final_verdict", {}).get("launch_recommendation", "")
                status_lower = str(status).lower()
                if "approved" in status_lower or "pilot" in status_lower or "go" in status_lower or "test" in status_lower or "proceed" in status_lower:
                    approved_pilots += 1
                elif "pivot" in status_lower or "caution" in status_lower or "validate" in status_lower or "research" in status_lower or "direction" in status_lower:
                    pivots_recommended += 1
                else:
                    not_feasible += 1

                inv_score = data.get("founder_decision_engine", {}).get("market_fit")
                if inv_score is None:
                    inv_score = data.get("investment_readiness", {}).get("investment_score", 50)
                sum_investment += int(inv_score)

                sat_score = data.get("founder_decision_engine", {}).get("competition")
                if sat_score is None:
                    sat_score = data.get("market_saturation", {}).get("score", 50)
                sum_saturation += int(sat_score)
                
                risk_score = data.get("founder_decision_engine", {}).get("risk")
                if risk_score is None:
                    risk_str = data.get("risk_analysis", {}).get("risk_level", "").lower()
                    risk_score = 80 if "high" in risk_str else 30 if "low" in risk_str else 50
                sum_risk += int(risk_score)

                count_valid += 1
            except Exception:
                pass

        if count_valid > 0:
            avg_investment = round(sum_investment / count_valid)
            avg_saturation = round(sum_saturation / count_valid)
            avg_risk = round(sum_risk / count_valid)

        # Formatting recent report payloads for API response
        formatted_recent = []
        for row in recent:
            created = row.get("created_at")
            if created:
                row["created_at"] = created if isinstance(created, str) else created.isoformat()
            
            try:
                report_data = json.loads(row["report_json"])
                status = report_data.get("final_verdict", {}).get("verdict_status") or report_data.get("final_verdict", {}).get("launch_recommendation", "Unknown")
                row["verdict_status"] = status
                row["title"] = report_data.get("executive_summary", {}).get("title", "Market Report")
                
                grade = report_data.get("final_verdict", {}).get("investment_grade")
                if not grade:
                    grade = report_data.get("investment_readiness", {}).get("grade", "-")
                row["grade"] = grade
                
                viability_score = report_data.get("founder_decision_engine", {}).get("market_fit")
                if viability_score is None:
                    viability_score = report_data.get("investment_readiness", {}).get("investment_score", 50)
                row["viability_score"] = int(viability_score)
            except Exception:
                row["verdict_status"] = "Unknown"
                row["title"] = "Market Report"
                row["grade"] = "-"
                row["viability_score"] = 50

            if "report_json" in row:
                del row["report_json"]
            formatted_recent.append(row)

        return jsonify({
            "metrics": {
                "total_ideas_analyzed": total_ideas,
                "approved_pilots_count": approved_pilots,
                "pivots_recommended_count": pivots_recommended,
                "not_feasible_count": not_feasible,
                "average_viability_score": avg_investment,
                "average_opportunity_score": avg_saturation,
                "average_risk_score": avg_risk
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
                status = report_data.get("final_verdict", {}).get("verdict_status") or report_data.get("final_verdict", {}).get("launch_recommendation", "Unknown")
                row["verdict_status"] = status
                row["title"] = report_data.get("executive_summary", {}).get("title", "Market Report")
                
                grade = report_data.get("final_verdict", {}).get("investment_grade")
                if not grade:
                    grade = report_data.get("investment_readiness", {}).get("grade", "-")
                row["grade"] = grade
                
                viability_score = report_data.get("founder_decision_engine", {}).get("market_fit")
                if viability_score is None:
                    viability_score = report_data.get("investment_readiness", {}).get("investment_score", 50)
                row["viability_score"] = int(viability_score)
            except Exception:
                row["verdict_status"] = "Unknown"
                row["title"] = "Market Report"
                row["grade"] = "-"
                row["viability_score"] = 50

            if "report_json" in row:
                del row["report_json"]
            formatted_history.append(row)

        return jsonify(formatted_history)
    except Exception as exc:
        logger.exception("History fetch failed:")
        return jsonify({"error": str(exc)}), 500
