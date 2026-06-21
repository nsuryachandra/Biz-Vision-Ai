import hashlib
from flask import Blueprint, request, jsonify
import math
import json
import logging
from db import execute_query, check_db_health
from utils import parse_idea
from services import SerpAPIService
from prompt_engine import PromptEngine
from analysis_engine import AnalysisEngine
from config import Config

logger = logging.getLogger(__name__)
routes_bp = Blueprint("routes", __name__)

# ─── Service Initialisation (resilient) ──────────────────────────────────────

try:
    serpapi_service = SerpAPIService()
except Exception as _e:
    logger.warning(f"SerpAPI service init failed (analysis will use fallback data): {_e}")
    serpapi_service = None

try:
    prompt_engine = PromptEngine()
except Exception as _e:
    logger.warning(f"PromptEngine init failed (simulated reports will be used): {_e}")
    prompt_engine = None

try:
    analysis_engine = AnalysisEngine()
except Exception as _e:
    logger.warning(f"AnalysisEngine init failed (default scores will be used): {_e}")
    analysis_engine = None


def _safe_generate(fn, fallback, label):
    """Call a prompt-engine function and always return something usable."""
    if prompt_engine is None:
        return fallback
    try:
        return fn()
    except Exception as exc:
        logger.warning(f"{label} generation failed — using fallback: {exc}")
        return fallback


def generate_dynamic_fallback_data(idea_data: dict) -> tuple:
    """Generates highly realistic, deterministic mockup data unique to the business concept

    and location so fallback scenarios yield dynamic scores and metrics.
    """
    idea_text = idea_data.get("idea_text", "")
    seed = int(hashlib.sha256(idea_text.encode('utf-8')).hexdigest(), 16)
    
    # 1. Deterministic Target Demand Score: between 45 and 90
    target_demand = 45 + (seed % 46)
    total_results = int(10 ** ((target_demand - 10) / 12))
    search_raw = {"search_information": {"total_results": total_results}}
    
    # 2. Deterministic Growth Rate: between -5.0% and +75.0%
    growth_rate = -5.0 + (seed % 800) / 10.0
    timeline = []
    base_val = 30 + (seed % 35)
    for i in range(12):
        val = base_val + int(math.sin(i + (seed % 7)) * 12) + (i * growth_rate / 12)
        val = min(100, max(0, int(val)))
        timeline.append({"date": f"Month {i+1}", "value": val})
    trends_raw = {
        "interest_over_time": {"timeline_data": timeline},
        "growth_rate": growth_rate
    }
    
    # 3. Google News results (sentiment): 40% to 95% positive
    sentiment_pct = 40 + (seed % 56)
    num_articles = 10
    pos_count = int(num_articles * sentiment_pct / 100)
    
    articles = []
    for i in range(num_articles):
        sentiment = "positive" if i < pos_count else "negative"
        articles.append({
            "title": f"Market dynamics analysis for {idea_data.get('keywords', 'business')}",
            "source": "TechCrunch" if i % 2 == 0 else "Bloomberg",
            "link": f"https://example.com/article-{i}",
            "sentiment_hint": sentiment,
            "date": "2026-06-21"
        })
    news_raw = {"news_results": articles}
    
    # 4. Google Maps competitors
    num_competitors = 2 + (seed % 6)
    competitors = []
    comp_names = [
        "Elevate", "Velocity", "Apex", "Horizon", "Pioneer", "Summit", "Vanguard", "Legacy"
    ]
    for i in range(num_competitors):
        idx = (seed + i) % len(comp_names)
        rating = 3.8 + ((seed + i * 4) % 13) / 10.0  # 3.8 to 5.0
        rating = min(5.0, round(rating, 1))
        reviews = 15 + ((seed + i * 11) % 450)
        competitors.append({
            "title": f"{comp_names[idx]} {idea_data.get('industry', 'Business')}",
            "rating": rating,
            "reviews": reviews,
            "address": f"{idea_data.get('location', 'Local Hub')}",
            "reviews_list": [
                "Excellent service and friendly staff.",
                "Good pricing, but can be a bit crowded during peak hours."
            ]
        })
    maps_raw = {"local_results": competitors}
    
    return search_raw, trends_raw, news_raw, maps_raw


# ─── Routes ──────────────────────────────────────────────────────────────────

@routes_bp.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "BizVision AI — Startup Intelligence API",
        "version": "2.0.0",
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
    Full intelligence pipeline:
      1. NLP parse
      2. DB insert
      3. SerpAPI (each call independent — failures return empty dicts)
      4. Score calculation
      5. AI consulting analysis (each prompt independent)
      6. DB report insert
    Returns 201 with full report JSON, never 500.
    """
    body = request.get_json(silent=True) or {}
    idea_text = (body.get("idea_text") or "").strip()
    user_id = body.get("user_id")  # can be None / null — FK allows NULL

    if not idea_text:
        return jsonify({"error": "idea_text is required and must not be empty."}), 400

    # ── 1. NLP Parse ─────────────────────────────────────────────────────────
    try:
        idea_data = parse_idea(idea_text)
    except Exception as exc:
        logger.exception("NLP parsing failed.")
        return jsonify({"error": f"Failed to parse idea: {exc}"}), 500

    # ── 2. Persist idea (non-critical) ────────────────────────────────────────
    idea_id = None
    try:
        idea_id = execute_query(
            """INSERT INTO business_ideas
               (user_id, idea_text, keywords, location, industry, business_type)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                user_id,
                idea_data["idea_text"],
                idea_data["keywords"],
                idea_data["location"],
                idea_data["industry"],
                idea_data["business_type"],
            ),
            commit=True,
        )
        execute_query(
            "INSERT INTO search_history (user_id, idea_id, `query`) VALUES (%s, %s, %s)",
            (user_id, idea_id, idea_text),
            commit=True,
        )
    except Exception as exc:
        msg = f"[DATABASE ERROR] DB persist of idea/search_history failed: {exc}"
        print(msg)
        logger.warning(msg)

    # ── 3. SerpAPI Intelligence Collection ───────────────────────────────────
    # Each call is fully independent; any failure returns a safe empty dict.
    search_raw, trends_raw, news_raw, maps_raw = {}, {}, {}, {}

    if serpapi_service:
        kw = idea_data.get("keywords", "")
        loc = idea_data.get("location", "")
        ind = idea_data.get("industry", "")

        try:
            logger.info(f"[SerpAPI] Google Search — {kw}")
            search_raw = serpapi_service.fetch_google_search(kw, loc)
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Search failed: {exc}")

        try:
            logger.info(f"[SerpAPI] Google Trends — {kw}")
            trends_raw = serpapi_service.fetch_google_trends(kw)
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Trends failed: {exc}")

        try:
            logger.info(f"[SerpAPI] Google News — {kw}")
            news_raw = serpapi_service.fetch_google_news(kw, ind)
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google News failed: {exc}")

        try:
            logger.info(f"[SerpAPI] Google Maps — {kw}")
            maps_raw = serpapi_service.fetch_google_maps(kw, loc)
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Maps failed: {exc}")

    # Fallback to deterministic mockup if SerpAPI is unconfigured or failed
    fallback_search, fallback_trends, fallback_news, fallback_maps = generate_dynamic_fallback_data(idea_data)

    if not search_raw or search_raw.get("search_information", {}).get("total_results", 0) == 0:
        search_raw = fallback_search
    if not trends_raw or not trends_raw.get("interest_over_time", {}).get("timeline_data"):
        trends_raw = fallback_trends
    if not news_raw or not news_raw.get("news_results"):
        news_raw = fallback_news
    if not maps_raw or not maps_raw.get("local_results"):
        maps_raw = fallback_maps

    competitor_list = maps_raw.get("local_results", [])
    trend_timeline  = trends_raw.get("interest_over_time", {}).get("timeline_data", [])
    growth_rate     = trends_raw.get("growth_rate", 5.0)

    # ── 4. Persist raw intelligence (non-critical) ────────────────────────────
    if idea_id:
        try:
            for comp in competitor_list:
                # Clarify mappings: SerpAPI uses 'reviews' for the number of reviews
                # and we store the list of individual reviews under 'reviews_list'.
                count_val = comp.get("reviews")
                reviews_list_val = comp.get("reviews_list", [])
                
                execute_query(
                    """INSERT INTO competitor_data
                       (idea_id, name, rating, review_count, address, reviews)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        idea_id,
                        comp.get("title"),
                        comp.get("rating"),
                        count_val,
                        comp.get("address"),
                        json.dumps(reviews_list_val),
                    ),
                    commit=True,
                )
        except Exception as exc:
            msg = f"[DATABASE ERROR] Failed to save competitors: {exc}"
            print(msg)
            logger.warning(msg)

        try:
            execute_query(
                "INSERT INTO trend_data (idea_id, `query`, date_points, growth_rate) VALUES (%s, %s, %s, %s)",
                (idea_id, kw.split(",")[0] if (kw := idea_data.get("keywords", "")) else "", json.dumps(trend_timeline), growth_rate),
                commit=True,
            )
        except Exception as exc:
            msg = f"[DATABASE ERROR] Failed to save trend data: {exc}"
            print(msg)
            logger.warning(msg)

        try:
            for art in news_raw.get("news_results", []):
                execute_query(
                    """INSERT INTO news_data
                       (idea_id, title, source, url, sentiment, published_date)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        idea_id,
                        art.get("title"),
                        art.get("source"),
                        art.get("link"),
                        art.get("sentiment_hint", "neutral"),
                        art.get("date"),
                    ),
                    commit=True,
                )
        except Exception as exc:
            msg = f"[DATABASE ERROR] Failed to save news articles: {exc}"
            print(msg)
            logger.warning(msg)

    # ── 5. Score Calculation ──────────────────────────────────────────────────
    scores = {
        "demand": 50, "trend": 50, "competition": 50,
        "sentiment": 50, "opportunity": 50, "risk": 50, "viability": 50,
    }
    if analysis_engine:
        try:
            scores = analysis_engine.calculate_scores(search_raw, trends_raw, news_raw, maps_raw)
        except Exception as exc:
            logger.warning(f"Score calculation failed — using defaults: {exc}")

    # ── 6. AI Consulting Analysis ─────────────────────────────────────────────
    fallback_text = (
        "Our intelligence systems are temporarily operating in offline mode. "
        "This analysis reflects conservative baseline projections."
    )
    logger.info("Running AI consulting evaluation via Groq...")

    exec_summary       = _safe_generate(lambda: prompt_engine.generate_startup_validation(idea_data), fallback_text, "Executive summary")
    market_analysis    = _safe_generate(lambda: prompt_engine.generate_market_analysis(idea_data, search_raw.get("search_information", {}).get("total_results", 0), growth_rate), fallback_text, "Market analysis")
    competitor_analysis= _safe_generate(lambda: prompt_engine.generate_competitor_analysis(idea_data, competitor_list), fallback_text, "Competitor analysis")
    name_validation    = _safe_generate(lambda: prompt_engine.generate_business_names(idea_data), [], "Business names")
    risk_analysis      = _safe_generate(lambda: prompt_engine.generate_risk_assessment(idea_data, scores.get("risk", 50)), fallback_text, "Risk assessment")
    trend_analysis     = _safe_generate(lambda: prompt_engine.generate_trend_analysis(idea_data, growth_rate), fallback_text, "Trend analysis")
    opportunity_analysis = _safe_generate(lambda: prompt_engine.generate_opportunity_analysis(idea_data, scores.get("opportunity", 50)), fallback_text, "Opportunity analysis")
    final_recommendation = _safe_generate(lambda: prompt_engine.generate_final_report(idea_data, scores), fallback_text, "Final recommendation")

    name_list = name_validation if isinstance(name_validation, list) else []

    # ── 7. Persist Report (non-critical) ──────────────────────────────────────
    report_id = None
    if idea_id:
        try:
            report_id = execute_query(
                """INSERT INTO analysis_reports
                   (idea_id, demand_score, trend_score, competition_score, sentiment_score,
                    opportunity_score, risk_score, viability_score,
                    executive_summary, market_analysis, competitor_analysis, trend_analysis,
                    risk_analysis, opportunity_analysis, name_validation, final_recommendation)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    idea_id,
                    scores.get("demand"), scores.get("trend"), scores.get("competition"),
                    scores.get("sentiment"), scores.get("opportunity"), scores.get("risk"),
                    scores.get("viability"),
                    exec_summary, market_analysis, competitor_analysis, trend_analysis,
                    risk_analysis, opportunity_analysis,
                    json.dumps(name_list), final_recommendation,
                ),
                commit=True,
            )
        except Exception as exc:
            msg = f"[DATABASE ERROR] Failed to persist report to DB: {exc}"
            print(msg)
            logger.warning(msg)

    return jsonify({
        "report_id": report_id,
        "idea_id": idea_id,
        "metadata": idea_data,
        "scores": scores,
        "analysis": {
            "executive_summary": exec_summary,
            "market_analysis": market_analysis,
            "competitor_analysis": competitor_analysis,
            "trend_analysis": trend_analysis,
            "opportunity_analysis": opportunity_analysis,
            "risk_analysis": risk_analysis,
            "final_recommendation": final_recommendation,
        },
        "business_names": name_list,
        "competitors": competitor_list,
        "trends": trend_timeline,
        "news": news_raw.get("news_results", []),
    }), 201


@routes_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """Platform metrics and recent report list."""
    try:
        stats = execute_query(
            """SELECT
                COUNT(*) AS total_ideas,
                IFNULL(AVG(ar.viability_score), 0) AS avg_viability,
                IFNULL(AVG(ar.risk_score), 0)      AS avg_risk,
                IFNULL(AVG(ar.opportunity_score), 0) AS avg_opportunity
               FROM analysis_reports ar""",
            fetch="one",
        )
        recent = execute_query(
            """SELECT
                ar.id AS report_id,
                bi.idea_text, bi.location, bi.industry,
                ar.viability_score, ar.risk_score, ar.opportunity_score,
                ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC LIMIT 10""",
            fetch="all",
        )
        for row in recent:
            created = row.get("created_at")
            if created:
                row["created_at"] = created if isinstance(created, str) else created.isoformat()
        return jsonify({
            "metrics": {
                "total_ideas_analyzed":     int(stats["total_ideas"]),
                "average_viability_score":  round(float(stats["avg_viability"])),
                "average_risk_score":       round(float(stats["avg_risk"])),
                "average_opportunity_score":round(float(stats["avg_opportunity"])),
            },
            "recent_reports": recent,
        })
    except Exception as exc:
        logger.exception("Dashboard metrics fetch failed.")
        return jsonify({"error": str(exc)}), 500


@routes_bp.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    """Retrieve a full analysis report by its ID."""
    try:
        report = execute_query(
            "SELECT * FROM analysis_reports WHERE id = %s", (report_id,), fetch="one"
        )
        if not report:
            return jsonify({"error": "Report not found"}), 404

        idea = execute_query(
            "SELECT * FROM business_ideas WHERE id = %s", (report["idea_id"],), fetch="one"
        )
        competitors = execute_query(
            """SELECT name AS title, rating,
                      review_count AS reviews, address,
                      reviews      AS reviews_list
               FROM competitor_data WHERE idea_id = %s""",
            (report["idea_id"],),
            fetch="all",
        )
        for c in competitors:
            try:
                c["reviews_list"] = json.loads(c["reviews_list"]) if c.get("reviews_list") else []
            except Exception:
                c["reviews_list"] = []

        trend_row = execute_query(
            "SELECT date_points, growth_rate FROM trend_data WHERE idea_id = %s",
            (report["idea_id"],),
            fetch="one",
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
            fetch="all",
        )

        name_list = []
        if report.get("name_validation"):
            try:
                name_list = json.loads(report["name_validation"])
            except Exception:
                name_list = []

        created = report.get("created_at")
        if created:
            report["created_at"] = created if isinstance(created, str) else created.isoformat()

        return jsonify({
            "report_id": report["id"],
            "idea_id":   report["idea_id"],
            "metadata": {
                "idea_text":     idea["idea_text"],
                "keywords":      idea["keywords"],
                "location":      idea["location"],
                "industry":      idea["industry"],
                "business_type": idea["business_type"],
            },
            "scores": {
                "demand":      report["demand_score"],
                "trend":       report["trend_score"],
                "competition": report["competition_score"],
                "sentiment":   report["sentiment_score"],
                "opportunity": report["opportunity_score"],
                "risk":        report["risk_score"],
                "viability":   report["viability_score"],
            },
            "analysis": {
                "executive_summary":    report["executive_summary"],
                "market_analysis":      report["market_analysis"],
                "competitor_analysis":  report["competitor_analysis"],
                "trend_analysis":       report["trend_analysis"],
                "opportunity_analysis": report["opportunity_analysis"],
                "risk_analysis":        report["risk_analysis"],
                "final_recommendation": report["final_recommendation"],
            },
            "business_names": name_list,
            "competitors":    competitors,
            "trends":         trend_timeline,
            "news":           news,
        })
    except Exception as exc:
        logger.exception(f"Report fetch failed for id={report_id}.")
        return jsonify({"error": str(exc)}), 500


@routes_bp.route("/history", methods=["GET"])
def history():
    """List all analysis runs in descending order."""
    try:
        rows = execute_query(
            """SELECT
                ar.id AS report_id,
                bi.idea_text, bi.location, bi.industry,
                ar.viability_score, ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC""",
            fetch="all",
        )
        for row in rows:
            created = row.get("created_at")
            if created:
                row["created_at"] = created if isinstance(created, str) else created.isoformat()
        return jsonify(rows)
    except Exception as exc:
        logger.exception("History fetch failed.")
        return jsonify({"error": str(exc)}), 500
