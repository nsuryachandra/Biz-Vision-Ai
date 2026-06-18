from flask import Blueprint, request, jsonify
import json
import logging
from db import execute_query, check_db_health
from utils import parse_idea
from services import SerpAPIService
from prompt_engine import PromptEngine
from analysis_engine import AnalysisEngine
from config import Config

logger = logging.getLogger(__name__)
routes_bp = Blueprint('routes', __name__)

# Initialize services
serpapi_service = SerpAPIService()
prompt_engine = PromptEngine()
analysis_engine = AnalysisEngine()

@routes_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "Welcome to the BizVision AI - Startup Intelligence API Portal",
        "version": "1.0.0"
    })

@routes_bp.route('/health', methods=['GET'])
def health():
    db_ok = check_db_health()
    return jsonify({
        "status": "healthy" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
        "serpapi_key_configured": bool(Config.SERPAPI_KEY),
        "gemini_key_configured": bool(Config.GEMINI_API_KEY)
    }), 200 if db_ok else 500

@routes_bp.route('/analyze', methods=['POST'])
def analyze():
    """Main route to perform NLP parsing, fetch data, calculate scores, run prompts, and save report."""
    data = request.get_json() or {}
    idea_text = data.get("idea_text")
    user_id = data.get("user_id") # Optional user login
    
    if not idea_text or not idea_text.strip():
        return jsonify({"error": "Idea text is required"}), 400

    try:
        # 1. NLP Processing
        idea_data = parse_idea(idea_text)
        
        # 2. Insert into business_ideas table
        idea_id = execute_query(
            """INSERT INTO business_ideas (user_id, idea_text, keywords, location, industry, business_type) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, idea_data["idea_text"], idea_data["keywords"], idea_data["location"], idea_data["industry"], idea_data["business_type"]),
            commit=True
        )
        
        # Insert into search_history table
        execute_query(
            "INSERT INTO search_history (user_id, idea_id, `query`) VALUES (%s, %s, %s)",
            (user_id, idea_id, idea_text),
            commit=True
        )

        # 3. Market Intelligence Collection (SerpAPI)
        logger.info(f"Fetching search statistics for: {idea_data['keywords']}")
        search_raw = serpapi_service.fetch_google_search(idea_data["keywords"], idea_data["location"])
        
        logger.info(f"Fetching trends statistics for: {idea_data['keywords']}")
        trends_raw = serpapi_service.fetch_google_trends(idea_data["keywords"])
        
        logger.info(f"Fetching news statistics for: {idea_data['keywords']}")
        news_raw = serpapi_service.fetch_google_news(idea_data["keywords"], idea_data["industry"])
        
        logger.info(f"Fetching local competitors from Maps: {idea_data['keywords']}")
        maps_raw = serpapi_service.fetch_google_maps(idea_data["keywords"], idea_data["location"])

        # 4. Save gathered raw intelligence to sub-tables
        # A. Save competitors
        competitor_list = maps_raw.get("local_results", [])
        for comp in competitor_list:
            execute_query(
                """INSERT INTO competitor_data (idea_id, name, rating, review_count, address, reviews) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (idea_id, comp.get("title"), comp.get("rating"), comp.get("reviews"), comp.get("address"), json.dumps(comp.get("reviews_list", []))),
                commit=True
            )
            
        # B. Save trends
        trend_timeline = trends_raw.get("interest_over_time", {}).get("timeline_data", [])
        growth_rate = trends_raw.get("growth_rate", 0.0)
        execute_query(
            "INSERT INTO trend_data (idea_id, `query`, date_points, growth_rate) VALUES (%s, %s, %s, %s)",
            (idea_id, idea_data["keywords"].split(",")[0], json.dumps(trend_timeline), growth_rate),
            commit=True
        )
        
        # C. Save news articles
        news_articles = news_raw.get("news_results", [])
        for art in news_articles:
            # Simple keyword sentiment assessment
            sentiment = art.get("sentiment_hint", "neutral")
            execute_query(
                """INSERT INTO news_data (idea_id, title, source, url, sentiment, published_date) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (idea_id, art.get("title"), art.get("source"), art.get("link"), sentiment, art.get("date")),
                commit=True
            )

        # 5. Compute Quantitative Scores
        scores = analysis_engine.calculate_scores(search_raw, trends_raw, news_raw, maps_raw)

        # 6. Generate Prompt-Engine AI Consulting Analysis
        logger.info("Executing Prompt Engine AI Consulting evaluation...")
        exec_summary = prompt_engine.generate_startup_validation(idea_data)
        market_analysis = prompt_engine.generate_market_analysis(idea_data, search_raw.get("search_information", {}).get("total_results", 120000), trends_raw.get("growth_rate", 10.0))
        competitor_analysis = prompt_engine.generate_competitor_analysis(idea_data, competitor_list)
        name_validation_list = prompt_engine.generate_business_names(idea_data)
        risk_analysis = prompt_engine.generate_risk_assessment(idea_data, scores["risk"])
        trend_analysis = prompt_engine.generate_trend_analysis(idea_data, trends_raw.get("growth_rate", 10.0))
        opportunity_analysis = prompt_engine.generate_opportunity_analysis(idea_data, scores["opportunity"])
        final_recommendation = prompt_engine.generate_final_report(idea_data, scores)

        # 7. Write consolidated Consulting Report to Database
        report_id = execute_query(
            """INSERT INTO analysis_reports 
               (idea_id, demand_score, trend_score, competition_score, sentiment_score, opportunity_score, risk_score, viability_score,
                executive_summary, market_analysis, competitor_analysis, trend_analysis, risk_analysis, opportunity_analysis, name_validation, final_recommendation) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (idea_id, scores["demand"], scores["trend"], scores["competition"], scores["sentiment"], scores["opportunity"], scores["risk"], scores["viability"],
             exec_summary, market_analysis, competitor_analysis, trend_analysis, risk_analysis, opportunity_analysis, json.dumps(name_validation_list), final_recommendation),
            commit=True
        )

        # Return full consulting report package
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
                "final_recommendation": final_recommendation
            },
            "business_names": name_validation_list,
            "competitors": competitor_list,
            "trends": trend_timeline,
            "news": news_articles
        }), 201

    except Exception as e:
        logger.exception("An error occurred during business idea analysis.")
        return jsonify({"error": str(e)}), 500

@routes_bp.route('/dashboard', methods=['GET'])
def dashboard():
    """Retrieve aggregate platform metrics and a lists of recent runs."""
    try:
        # Aggregate statistics
        stats = execute_query(
            """SELECT 
                COUNT(*) as total_ideas,
                IFNULL(AVG(ar.viability_score), 0) as avg_viability,
                IFNULL(AVG(ar.risk_score), 0) as avg_risk,
                IFNULL(AVG(ar.opportunity_score), 0) as avg_opportunity
               FROM analysis_reports ar""",
            fetch='one'
        )
        
        # Recent reports list
        recent_list = execute_query(
            """SELECT 
                ar.id as report_id,
                bi.idea_text,
                bi.location,
                bi.industry,
                ar.viability_score,
                ar.risk_score,
                ar.opportunity_score,
                ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC LIMIT 10""",
            fetch='all'
        )
        
        # Format dates to string
        for item in recent_list:
            if item.get("created_at"):
                item["created_at"] = item["created_at"].isoformat()

        return jsonify({
            "metrics": {
                "total_ideas_analyzed": stats["total_ideas"],
                "average_viability_score": round(float(stats["avg_viability"])),
                "average_risk_score": round(float(stats["avg_risk"])),
                "average_opportunity_score": round(float(stats["avg_opportunity"]))
            },
            "recent_reports": recent_list
        })
    except Exception as e:
        logger.exception("Failed to load dashboard metrics.")
        return jsonify({"error": str(e)}), 500

@routes_bp.route('/report/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Retrieve full analysis report by ID."""
    try:
        report = execute_query(
            "SELECT * FROM analysis_reports WHERE id = %s",
            (report_id,),
            fetch='one'
        )
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        idea = execute_query(
            "SELECT * FROM business_ideas WHERE id = %s",
            (report["idea_id"],),
            fetch='one'
        )
        
        competitors = execute_query(
            "SELECT name as title, rating, review_count as reviews, address, reviews as reviews_list FROM competitor_data WHERE idea_id = %s",
            (report["idea_id"],),
            fetch='all'
        )
        # Parse reviews list JSON
        for c in competitors:
            try:
                c["reviews_list"] = json.loads(c["reviews_list"]) if c.get("reviews_list") else []
            except Exception:
                c["reviews_list"] = []

        trends = execute_query(
            "SELECT date_points, growth_rate FROM trend_data WHERE idea_id = %s",
            (report["idea_id"],),
            fetch='one'
        )
        trend_timeline = []
        if trends:
            try:
                trend_timeline = json.loads(trends["date_points"])
            except Exception:
                trend_timeline = []
                
        news = execute_query(
            "SELECT title, source, url as link, sentiment as sentiment_hint, published_date as date FROM news_data WHERE idea_id = %s",
            (report["idea_id"],),
            fetch='all'
        )

        name_validation_list = []
        if report.get("name_validation"):
            try:
                name_validation_list = json.loads(report["name_validation"])
            except Exception:
                name_validation_list = []

        return jsonify({
            "report_id": report["id"],
            "idea_id": report["idea_id"],
            "metadata": {
                "idea_text": idea["idea_text"],
                "keywords": idea["keywords"],
                "location": idea["location"],
                "industry": idea["industry"],
                "business_type": idea["business_type"]
            },
            "scores": {
                "demand": report["demand_score"],
                "trend": report["trend_score"],
                "competition": report["competition_score"],
                "sentiment": report["sentiment_score"],
                "opportunity": report["opportunity_score"],
                "risk": report["risk_score"],
                "viability": report["viability_score"]
            },
            "analysis": {
                "executive_summary": report["executive_summary"],
                "market_analysis": report["market_analysis"],
                "competitor_analysis": report["competitor_analysis"],
                "trend_analysis": report["trend_analysis"],
                "opportunity_analysis": report["opportunity_analysis"],
                "risk_analysis": report["risk_analysis"],
                "final_recommendation": report["final_recommendation"]
            },
            "business_names": name_validation_list,
            "competitors": competitors,
            "trends": trend_timeline,
            "news": news
        })
    except Exception as e:
        logger.exception(f"Failed to fetch report with id {report_id}.")
        return jsonify({"error": str(e)}), 500

@routes_bp.route('/history', methods=['GET'])
def history():
    """Retrieve history of searches."""
    try:
        results = execute_query(
            """SELECT 
                ar.id as report_id,
                bi.idea_text,
                bi.location,
                bi.industry,
                ar.viability_score,
                ar.created_at
               FROM analysis_reports ar
               JOIN business_ideas bi ON ar.idea_id = bi.id
               ORDER BY ar.created_at DESC""",
            fetch='all'
        )
        for item in results:
            if item.get("created_at"):
                item["created_at"] = item["created_at"].isoformat()
        return jsonify(results)
    except Exception as e:
        logger.exception("Failed to retrieve query history.")
        return jsonify({"error": str(e)}), 500
