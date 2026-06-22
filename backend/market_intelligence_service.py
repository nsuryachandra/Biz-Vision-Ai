import re
import json
import logging
import requests
import time
from urllib.parse import urlparse
import google.generativeai as genai

from config import Config
from db import execute_query

logger = logging.getLogger(__name__)

class MarketIntelligenceService:
    def __init__(self):
        self.serpapi_key = Config.SERPAPI_KEY
        self.serpapi_url = "https://serpapi.com/search"
        self.groq_api_key = Config.GROQ_API_KEY
        self.groq_api_key_backup = getattr(Config, "GROQ_API_KEY_1", None)
        self.gemini_api_key = Config.GEMINI_API_KEY

        if self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
            except Exception as e:
                logger.warning(f"Failed to configure Gemini client: {e}")
                self.gemini_model = None
        else:
            self.gemini_model = None

    # ─── API Logging helpers ──────────────────────────────────────────────────

    def _log_api_call(self, api_name, endpoint, status_code, data):
        try:
            execute_query(
                "INSERT INTO api_logs (api_name, endpoint, status_code, response_summary) VALUES (%s, %s, %s, %s)",
                (
                    api_name,
                    endpoint,
                    status_code,
                    json.dumps({"success": status_code == 200, "keys": list(data.keys()) if isinstance(data, dict) else []}),
                ),
                commit=True,
            )
        except Exception as exc:
            logger.debug(f"API log write skipped: {exc}")

    def _log_prompt_call(self, prompt_name, input_vars, prompt_text, response_text):
        try:
            execute_query(
                "INSERT INTO prompt_logs (prompt_name, input_variables, prompt_text, response_text) VALUES (%s, %s, %s, %s)",
                (prompt_name, json.dumps(input_vars), prompt_text, response_text),
                commit=True,
            )
        except Exception as e:
            logger.error(f"Failed to log prompt: {e}")

    # ─── SerpAPI Data Fetchers ────────────────────────────────────────────────

    def _serpapi_get(self, params, api_name):
        if not self.serpapi_key or self.serpapi_key == "YOUR_SERPAPI_KEY_HERE":
            logger.warning(f"{api_name} skipped: SerpAPI key not configured.")
            return {}
        
        params["api_key"] = self.serpapi_key
        try:
            resp = requests.get(self.serpapi_url, params=params, timeout=15)
            status = resp.status_code
            data = resp.json() if status == 200 else {"error": resp.text}
            self._log_api_call(api_name, str(params.get("q", "")), status, data)
            if status != 200:
                logger.warning(f"{api_name} returned status {status}: {data.get('error', 'unknown')}")
                return {}
            return data
        except Exception as exc:
            logger.warning(f"{api_name} request failed: {exc}")
            return {}

    def fetch_google_search(self, keywords: str, location: str) -> dict:
        loc_lower = location.lower().strip() if location else ""
        if not loc_lower or any(val in loc_lower for val in ["global / online", "global", "online", "virtual", "remote", "worldwide"]):
            query = f"{keywords} business market"
        else:
            query = f"{keywords} {location} business market"
        
        return self._serpapi_get({"engine": "google", "q": query}, "Google Search")

    def fetch_google_trends(self, keywords: str) -> dict:
        topic = keywords.split(",")[0].strip()
        return self._serpapi_get({"engine": "google_trends", "q": topic, "date": "today 12-m"}, "Google Trends")

    def fetch_google_news(self, keywords: str, industry: str) -> dict:
        query = f"{keywords} {industry} market trends"
        return self._serpapi_get({"engine": "google", "tbm": "nws", "q": query}, "Google News")

    def fetch_google_maps(self, keywords: str, location: str) -> dict:
        loc_lower = location.lower().strip() if location else ""
        if not loc_lower or any(val in loc_lower for val in ["global / online", "global", "online", "virtual", "remote", "worldwide"]):
            query = keywords
        else:
            query = f"{keywords} near {location}"
        
        return self._serpapi_get({"engine": "google_maps", "q": query}, "Google Maps")

    def fetch_google_shopping(self, keywords: str) -> dict:
        topic = keywords.split(",")[0].strip()
        return self._serpapi_get({"engine": "google_shopping", "q": topic}, "Google Shopping")



    # ─── LLM Caller ───────────────────────────────────────────────────────────

    def _call_llm(self, prompt_text):
        response_content = None
        
        # 1. Primary Groq
        if self.groq_api_key and self.groq_api_key != "YOUR_GROQ_API_KEY_HERE":
            try:
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt_text}],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
                resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=25)
                if resp.status_code == 200:
                    response_content = resp.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Generated intelligence report via primary Groq API.")
                else:
                    logger.warning(f"Primary Groq returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Primary Groq failed: {e}")

        # 2. Backup Groq
        if not response_content and self.groq_api_key_backup:
            try:
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key_backup}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt_text}],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
                resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=25)
                if resp.status_code == 200:
                    response_content = resp.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Generated intelligence report via backup Groq API.")
                else:
                    logger.warning(f"Backup Groq returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Backup Groq failed: {e}")

        # 3. Gemini Fallback
        if not response_content and self.gemini_model:
            try:
                response = self.gemini_model.generate_content(
                    prompt_text,
                    generation_config={"response_mime_type": "application/json"}
                )
                response_content = response.text.strip()
                logger.info("Generated intelligence report via fallback Gemini API.")
            except Exception as e:
                logger.warning(f"Fallback Gemini API failed: {e}")

        return response_content

    # ─── Prompt Construction ──────────────────────────────────────────────────

    def build_prompt(self, idea_data: dict, market_data: dict) -> str:
        prompt_template = """System: You are an elite Venture Capital Investment Committee Chair and McKinsey Business Intelligence Consultant.
You are generating a premium business intelligence report for a startup concept.
You must analyze the collected real-market API data below and build a comprehensive, highly strategic report.

REAL-MARKET API DATA COLLECTED:
1. Search Demand Signal: {search_results_count} total Google index matches found.
2. 12-Month Trends growth rate: {trends_growth_rate}%
3. Real competitors identified in {location} (from Google Maps API):
{competitors_json}
4. Current Market News and Sentiment (from Google News API):
{news_json}
5. Alternative products/pricing (from Google Shopping API):
{shopping_json}

STARTUP CONCEPT DETAILS:
- Original Idea Text: "{idea_text}"
- Location: {location}
- Main Industry: {industry}
- Category Type: {business_type}
- Sub-Category/Niche: {sub_category}
- Extracted Keywords: {keywords}
- Data Collection Warnings: {warnings}

CRITICAL DATA GUIDELINES:
- You must ONLY use the real competitor names, addresses, review counts, news titles, sources, and shopping prices provided in the API data.
- If no competitors are provided, report that no local competitors were found in this region. Do not invent any competitor names, reviews, ratings, news articles, or shopping items.
- Maintain maximum color fidelity, sharpness, and high-quality insight paragraphs. Do not wrap sections in any markdown fences.
- Return a single, valid JSON object matching this structure EXACTLY. No comments, no extra characters.

{{
  "hero_summary": {{
    "title": "A highly premium, professional business title (e.g. 'Elevate Fitness Studio')",
    "tagline": "A compelling 1-line brand tagline",
    "market_opportunity_status": "🟢 High Potential / 🟡 Proceed with Caution / 🔴 High Risk",
    "critical_requirement": "One sentence explaining the single most critical dependency for launch success."
  }},
  "executive_verdict": {{
    "verdict_summary": "A 2-3 sentence McKinsey-style verdict assessing general feasibility, location-fit, and capital requirement.",
    "verdict_status": "🟢 Approved for Pilot / 🟡 Pivot Recommended / 🔴 Not Feasible",
    "financial_viability_outlook": "Premium, Medium, or Low"
  }},
  "market_overview": {{
    "total_search_volume_indicator": "High, Moderate, or Low search velocity",
    "industry_trends_analysis": "A concise paragraph summarizing local customer demand trajectory based on search results count.",
    "maturity_level": "Emerging, Growth, or Saturated"
  }},
  "trend_insights": {{
    "trajectory": "Rising, Stable, or Declining",
    "regional_velocity_description": "Explain growth rate of {trends_growth_rate}% interest velocity and general search momentum over the past 12 months.",
    "forecast": "1-sentence projection of market trajectory over the next 18 months."
  }},
  "competitor_insights": {{
    "competitors_found_count": 0,
    "direct_rivals": [
      {{
        "name": "[Rival Name from Maps Data]",
        "rating": 4.5,
        "reviews": 120,
        "address": "[Address/Area]",
        "vulnerability": "[Identify a vulnerability based on reviews/ratings or local constraints, max 15 words]"
      }}
    ],
    "local_market_gap": "Explain the exact gap or underserved segment in the local market (e.g. hygiene standards, digital booking, unique packages)."
  }},
  "opportunity_radar": {{
    "strengths": [
      "Strength #1 (max 10 words)",
      "Strength #2 (max 10 words)"
    ],
    "high_margin_avenues": [
      "High margin upsell opportunity #1 (max 12 words)",
      "High margin upsell opportunity #2 (max 12 words)"
    ]
  }},
  "risk_radar": {{
    "threats": [
      "External threat #1 (max 10 words)",
      "External threat #2 (max 10 words)"
    ],
    "barriers_to_entry": [
      "Primary barrier/regulation #1 (max 12 words)",
      "Secondary barrier/regulation #2 (max 12 words)"
    ]
  }},
  "audience_insights": {{
    "primary_persona": "Description of the main customer profile (age, lifestyle, priority)",
    "price_sensitivity": "High, Medium, or Premium-friendly based on Google Shopping prices",
    "key_purchasing_driver": "What motivates them to purchase (e.g., convenience, organic source, speed)"
  }},
  "launch_strategy": {{
    "phase_1_validation": "Action item for validation in week 1-2 (max 15 words)",
    "phase_2_setup": "Action item for setting up MVP in week 3-4 (max 15 words)",
    "phase_3_pilot": "Action item for soft-launch in month 2 (max 15 words)",
    "phase_4_scale": "Action item for scaling in month 3 (max 15 words)"
  }},
  "brand_suggestions": {{
    "suggested_brand_names": [
      {{
        "name": "Brand Name Suggestion 1",
        "tagline": "Tagline 1",
        "rationale": "Short explanation of brand connection"
      }},
      {{
        "name": "Brand Name Suggestion 2",
        "tagline": "Tagline 2",
        "rationale": "Short explanation of brand connection"
      }}
    ],
    "recommended_logo_concept": "Creative visual concept for logo and color palette representation."
  }},
  "final_recommendation": {{
    "overall_score_equivalent": "A letter grade (A+, A, B, C, or D) representing overall investment potential",
    "strategic_verdict": "Concluding strategic recommendation for the founder (2 sentences)."
  }}
}}
"""
        return prompt_template.format(
            idea_text=idea_data["idea_text"],
            keywords=idea_data["keywords"],
            location=idea_data["location"],
            industry=idea_data["industry"],
            business_type=idea_data["business_type"],
            sub_category=idea_data.get("sub_category", "N/A"),
            search_results_count=market_data["search_results_count"],
            trends_growth_rate=market_data["trends"]["growth_rate"],
            competitors_json=json.dumps(market_data["competitors"], indent=2),
            news_json=json.dumps(market_data["news"], indent=2),
            shopping_json=json.dumps(market_data["shopping"], indent=2),
            warnings=", ".join(market_data.get("warnings", [])) or "None"
        )

    # ─── Idea Parsing / Classification via LLM ─────────────────────────────────

    def parse_idea_via_llm(self, idea_text: str, location: str = "Global / Online") -> dict:
        """
        Classifies and extracts structured metadata from the raw business idea
        using Groq / Gemini. Relies on a robust fallback if APIs are unavailable.
        """
        prompt = f"""You are an elite business analyst and startup classification engine.
Analyze the following startup/business idea text and extract the key attributes.
You must return a valid JSON object matching this schema EXACTLY:
{{
  "idea_text": "The original input text, cleaned of unnecessary spacing.",
  "keywords": "A comma-separated string of 3-5 main descriptive search keywords/queries (e.g. 'gym, yoga, fitness class'). No stop words.",
  "industry": "Most accurate industry classification determined by AI.",
  "business_type": "Most accurate business model classification determined by AI.",
  "sub_category": "Specific niche/subsegment determined by AI."
}}

Startup Idea Text: "{idea_text}"

Return only the JSON object. Do not include markdown fences, preambles, or additional text.
"""
        response_text = self._call_llm(prompt)
        parsed = {}
        if response_text:
            clean = response_text.strip()
            if "```" in clean:
                m = re.search(r"```(?:json)?(.*?)```", clean, re.DOTALL)
                if m:
                    clean = m.group(1).strip()
            try:
                parsed = json.loads(clean)
            except Exception as e:
                logger.warning(f"LLM parse_idea_via_llm failed to decode JSON: {e}. Raw: {response_text}")

        # Ensure all keys exist, fallback if needed
        keywords = parsed.get("keywords") or ""
        if not keywords:
            # Fallback keyword extraction: take non-stop words
            stop_words = {'i', 'want', 'to', 'start', 'a', 'an', 'the', 'business', 'company', 'startup', 'in', 'at', 'for'}
            words = [w.lower() for w in re.findall(r'\b\w+\b', idea_text) if w.lower() not in stop_words and len(w) > 2]
            keywords = ", ".join(words[:4]) if words else "startup"

        return {
            "idea_text": idea_text,
            "keywords": keywords,
            "location": location,
            "industry": parsed.get("industry") or "General Business",
            "business_type": parsed.get("business_type") or "General Service",
            "sub_category": parsed.get("sub_category") or "General Niche"
        }

    # ─── Orchestrator ──────────────────────────────────────────────────────────

    def analyze_idea(self, idea_text: str, user_id=None, location=None) -> dict:
        # ── 1. NLP Parse
        idea_data = self.parse_idea_via_llm(idea_text, location=location or "Global / Online")
        
        # ── 2. Persist Idea
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
                    idea_data["business_type"]
                ),
                commit=True
            )
            execute_query(
                "INSERT INTO search_history (user_id, idea_id, `query`) VALUES (%s, %s, %s)",
                (user_id, idea_id, idea_text),
                commit=True
            )
        except Exception as e:
            logger.warning(f"Database persist of business idea failed: {e}")

        # ── 3. Gather API Data (with safe empty defaults)
        kw = idea_data.get("keywords", "")
        loc = idea_data.get("location", "")
        ind = idea_data.get("industry", "")
        
        search_raw = self.fetch_google_search(kw, loc)
        trends_raw = self.fetch_google_trends(kw)
        news_raw = self.fetch_google_news(kw, ind)
        maps_raw = self.fetch_google_maps(kw, loc)
        shopping_raw = self.fetch_google_shopping(kw)
        
        # Normalize gathered API data
        search_count = search_raw.get("search_information", {}).get("total_results", 0)
        if isinstance(search_count, str):
            search_count = int("".join(filter(str.isdigit, search_count)) or "0")
            
        trends_data = trends_raw.get("interest_over_time", {}).get("timeline_data", [])
        trends_growth = trends_raw.get("growth_rate", 0.0) if trends_data else 0.0
        
        news_articles = news_raw.get("news_results", [])
        competitors = maps_raw.get("local_results", [])
        shopping_products = shopping_raw.get("shopping_results", [])
        
        warnings = []
        if not competitors:
            competitors = []
            warnings.append("Competitor data unavailable")
        if not news_articles:
            news_articles = []
            warnings.append("News data unavailable")
        if not shopping_products:
            shopping_products = []
            warnings.append("Shopping data unavailable")
        if not trends_data:
            trends_data = []
            warnings.append("Trends data unavailable")
        if not search_count:
            search_count = 0
            warnings.append("Search data unavailable")
            
        market_data = {
            "search_results_count": search_count,
            "trends": {"timeline_data": trends_data, "growth_rate": trends_growth},
            "news": news_articles,
            "competitors": competitors,
            "shopping": shopping_products,
            "warnings": warnings
        }

        # ── 4. Persist API Data to Database
        if idea_id:
            try:
                for comp in competitors:
                    reviews_snippet = comp.get("reviews_list", [])
                    execute_query(
                        """INSERT INTO competitor_data
                           (idea_id, name, rating, review_count, address, reviews)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (
                            idea_id,
                            comp.get("title"),
                            comp.get("rating"),
                            comp.get("reviews"),
                            comp.get("address"),
                            json.dumps(reviews_snippet)
                        ),
                        commit=True
                    )
            except Exception as e:
                logger.warning(f"Failed to save competitors to database: {e}")

            try:
                execute_query(
                    "INSERT INTO trend_data (idea_id, `query`, date_points, growth_rate) VALUES (%s, %s, %s, %s)",
                    (idea_id, kw.split(",")[0] if kw else "", json.dumps(trends_data), trends_growth),
                    commit=True
                )
            except Exception as e:
                logger.warning(f"Failed to save trend_data to database: {e}")

            try:
                for art in news_articles:
                    execute_query(
                        """INSERT INTO news_data
                           (idea_id, title, source, url, sentiment, published_date)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (
                            idea_id,
                            art.get("title"),
                            art.get("source"),
                            art.get("link"),
                            art.get("sentiment_hint" if "sentiment_hint" in art else "sentiment", "neutral"),
                            art.get("date")
                        ),
                        commit=True
                    )
            except Exception as e:
                logger.warning(f"Failed to save news_data to database: {e}")

            try:
                for prod in shopping_products:
                    execute_query(
                        """INSERT INTO shopping_data
                           (idea_id, title, price, source, rating, reviews, thumbnail)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (
                            idea_id,
                            prod.get("title"),
                            prod.get("price"),
                            prod.get("source"),
                            prod.get("rating"),
                            prod.get("reviews"),
                            prod.get("thumbnail")
                        ),
                        commit=True
                    )
            except Exception as e:
                logger.warning(f"Failed to save shopping_data to database: {e}")

        # ── 5. Call LLM
        prompt = self.build_prompt(idea_data, market_data)
        logger.info("Invoking AI model (Groq) for final synthesis...")
        response_text = self._call_llm(prompt)
        
        # Parse & Validate JSON
        report_json = {}
        if response_text:
            clean = response_text
            if "```" in response_text:
                m = re.search(r"```(?:json)?(.*?)```", response_text, re.DOTALL)
                if m:
                    clean = m.group(1).strip()
            try:
                report_json = json.loads(clean)
                self._log_prompt_call("market_intelligence_report", idea_data, prompt, response_text)
            except Exception as e:
                logger.warning(f"Failed to parse JSON response from LLM: {e}. Raw response: {response_text}")

        # Return error state if LLM failed
        if not report_json:
            logger.error("LLM synthesis failed. AI report generation unavailable.")
            return {
                "success": False,
                "error": "AI report generation unavailable",
                "report": None
            }
            
        # ── 6. Persist Report to Database
        report_id = None
        if idea_id:
            try:
                report_id = execute_query(
                    "INSERT INTO analysis_reports (idea_id, report_json) VALUES (%s, %s)",
                    (idea_id, json.dumps(report_json)),
                    commit=True
                )
            except Exception as e:
                logger.error(f"Failed to persist report to DB: {e}")

        return {
            "report_id": report_id,
            "idea_id": idea_id,
            "metadata": idea_data,
            "report": report_json,
            "competitors": competitors,
            "trends": trends_data,
            "news": news_articles,
            "shopping": shopping_products
        }


