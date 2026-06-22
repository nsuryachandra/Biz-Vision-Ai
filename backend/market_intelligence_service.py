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
        query = f"{location} {keywords}"
        return self._serpapi_get({"engine": "google", "q": query}, "Google Search")

    def _get_geo_for_location(self, location: str) -> str:
        if not location:
            return None
        india_terms = {"india", "hyderabad", "punjagutta", "gachibowli", "madhapur", "bangalore", "mumbai", "delhi", "chennai", "kolkata", "pune"}
        loc_lower = location.lower()
        for term in india_terms:
            if term in loc_lower:
                return "IN"
        if "us" in loc_lower or "united states" in loc_lower:
            return "US"
        if "uk" in loc_lower or "united kingdom" in loc_lower or "london" in loc_lower:
            return "GB"
        if "ca" in loc_lower or "canada" in loc_lower:
            return "CA"
        if "au" in loc_lower or "australia" in loc_lower:
            return "AU"
        return None

    def fetch_google_trends(self, keywords: str, location: str) -> dict:
        topic = keywords.split(",")[0].strip()
        query = f"{location} {topic}"
        params = {
            "engine": "google_trends",
            "q": query,
            "date": "today 12-m"
        }
        geo = self._get_geo_for_location(location)
        if geo:
            params["geo"] = geo
        return self._serpapi_get(params, "Google Trends")

    def fetch_google_news(self, keywords: str, location: str, industry: str) -> dict:
        query = f"{location} {keywords}"
        res = self._serpapi_get({"engine": "google", "tbm": "nws", "q": query}, "Google News")
        if not res or not res.get("news_results"):
            fallback_query = f"{location} {industry}"
            res = self._serpapi_get({"engine": "google", "tbm": "nws", "q": fallback_query}, "Google News")
        return res

    def fetch_google_maps(self, keywords: str, location: str) -> dict:
        query = f"{keywords} {location}"
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
1. Top Google Search Results:
{search_results_json}
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
- RULE: Only identify competitor vulnerabilities if supported by actual review evidence supplied in API data. If evidence is unavailable, output exactly: "Insufficient data".
- Maintain maximum color fidelity, sharpness, and high-quality insight paragraphs. Do not wrap sections in any markdown fences.
- Return a single, valid JSON object matching this structure EXACTLY. No comments, no extra characters.

{{
  "executive_summary": {{
    "title": "A highly premium, professional business title (e.g. 'Elevate Fitness Studio')",
    "tagline": "A compelling 1-line brand tagline",
    "critical_requirement": "One sentence explaining the single most critical dependency for launch success.",
    "brand_suggestions": [
      {{
        "name": "Suggested Brand Name 1",
        "tagline": "Tagline 1",
        "rationale": "Short explanation of connection"
      }},
      {{
        "name": "Suggested Brand Name 2",
        "tagline": "Tagline 2",
        "rationale": "Short explanation of connection"
      }}
    ]
  }},
  "market_intelligence": {{
    "search_velocity": "High, Moderate, or Low search velocity based on search results",
    "interest_momentum": "Explain growth rate of {trends_growth_rate}% interest velocity and general search momentum over the past 12 months.",
    "forecast": "1-sentence projection of market trajectory over the next 18 months."
  }},
  "competitor_intelligence": {{
    "market_leader": "Name of the leading competitor from maps data, or 'Insufficient data' if none found",
    "top_competitors": [
      {{
        "name": "[Rival Name from Maps Data]",
        "rating": 4.5,
        "reviews": 120,
        "address": "[Address/Area]",
        "differentiator": "A 1-sentence differentiator strategy"
      }}
    ],
    "common_strengths": ["Strength 1 (max 10 words)", "Strength 2 (max 10 words)"],
    "common_weaknesses": ["Weakness 1 (max 10 words)", "Weakness 2 (max 10 words)"],
    "unserved_opportunities": ["Opportunity 1 (max 12 words)", "Opportunity 2 (max 12 words)"]
  }},
  "customer_sentiment": {{
    "love_factors": ["Love factor 1 (max 10 words)", "Love factor 2 (max 10 words)"],
    "pain_points": ["Pain point 1 (max 10 words)", "Pain point 2 (max 10 words)"],
    "buying_triggers": ["Trigger 1 (max 12 words)", "Trigger 2 (max 12 words)"],
    "market_gap": "Explain the exact gap or underserved segment in the local market based on competitor reviews."
  }},
  "market_saturation": {{
    "score": 74,
    "grade": "B",
    "state": "Competitive / Saturated / Fragmented",
    "explanation": "Provide a detailed justification for the saturation score based on competitor density and search demand."
  }},
  "revenue_potential": {{
    "low_case": "Monthly revenue estimate under conservative scenario in local currency (e.g., ₹2,50,000)",
    "expected_case": "Monthly revenue estimate under expected scenario (e.g., ₹8,00,000)",
    "high_case": "Monthly revenue estimate under aggressive scenario (e.g., ₹20,00,000)",
    "assumptions": ["Assumption 1 (e.g., average customer spend, footfall)", "Assumption 2"]
  }},
  "startup_costs": {{
    "minimum_cost": "Minimum launch cost in local currency (e.g., ₹5,00,000)",
    "recommended_cost": "Recommended launch cost (e.g., ₹15,00,000)",
    "premium_launch_cost": "Premium launch cost (e.g., ₹30,00,000)"
  }},
  "location_analysis": {{
    "location_score": 86,
    "grade": "A",
    "analysis": "Specific location analysis based on proximity, density, and local accessibility factors of {location}."
  }},
  "swot_analysis": {{
    "strengths": ["Strength 1 (max 10 words)", "Strength 2"],
    "weaknesses": ["Weakness 1 (max 10 words)", "Weakness 2"],
    "opportunities": ["Opportunity 1 (max 12 words)", "Opportunity 2"],
    "threats": ["Threat 1 (max 10 words)", "Threat 2"]
  }},
  "risk_analysis": {{
    "risk_level": "High, Medium, or Low",
    "top_risks": ["Risk 1 (max 10 words)", "Risk 2"],
    "mitigation_strategies": ["Mitigation strategy 1", "Mitigation strategy 2"]
  }},
  "investment_readiness": {{
    "investment_score": 91,
    "grade": "A+",
    "recommendation": "Strategic recommendation for the founder (2 sentences) on investment viability."
  }},
  "launch_roadmap": {{
    "first_30_days": ["Action item 1", "Action item 2"],
    "days_31_to_60": ["Action item 1", "Action item 2"],
    "days_61_to_90": ["Action item 1", "Action item 2"]
  }},
  "final_verdict": {{
    "verdict_status": "🟢 Approved for Pilot / 🟡 Pivot Recommended / 🔴 Not Feasible",
    "financial_viability_outlook": "Premium, Medium, or Low",
    "confidence_level": 85
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
            search_results_json=json.dumps(market_data.get("top_search_results", []), indent=2),
            trends_growth_rate=market_data["trends"]["growth_rate"],
            competitors_json=json.dumps(market_data["competitors"], indent=2),
            news_json=json.dumps(market_data["news"], indent=2),
            shopping_json=json.dumps(market_data["shopping"], indent=2),
            warnings=", ".join(market_data.get("warnings", [])) or "None"
        )

    # ─── Idea Parsing / Classification via LLM ─────────────────────────────────

    def parse_idea_via_llm(self, idea_text: str, location: str = None) -> dict:
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

    def extract_location_from_text(self, text: str) -> str:
        """
        Extract target location deterministically using regex.
        Looks for patterns like 'in [Location]', 'at [Location]', 'for [Location]'.
        """
        if not text:
            return None
            
        # Look for 'in <Location>', 'at <Location>', 'near <Location>', 'based in <Location>', 'located in <Location>'
        # e.g., "bakery in Austin, TX" or "gym in Seattle" or "hotel at Punjagutta"
        patterns = [
            r'\b(?:in|at|near|based\s+in|located\s+in)\s+([A-Z][a-zA-Z]+(?:\s*(?:,\s*|\s+)[A-Z][a-zA-Z]+)*)\b',
            r'\b(?:in|at|near|based\s+in|located\s+in)\s+([a-zA-Z]+(?:\s*(?:,\s*|\s+)[a-zA-Z]+)*)\b'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                loc = match.group(1).strip()
                # Filter out common false positives
                if loc.lower() not in ["a", "the", "my", "our", "an", "business", "market", "industry", "any", "some", "detail", "details"]:
                    return loc
                    
        return None

    # ─── Orchestrator ──────────────────────────────────────────────────────────

    def analyze_idea(self, idea_text: str, user_id=None, location=None) -> dict:
        # ── 1. Enforce explicit location input and reject empty locations
        if not location or not location.strip():
            location = self.extract_location_from_text(idea_text)
            
        if not location or not location.strip():
            return {
                "success": False,
                "error": "Please specify a target location."
            }
            
        # ── 2. NLP Parse
        idea_data = self.parse_idea_via_llm(idea_text, location=location)
        
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
        trends_raw = self.fetch_google_trends(kw, loc)
        news_raw = self.fetch_google_news(kw, loc, ind)
        maps_raw = self.fetch_google_maps(kw, loc)
        shopping_raw = self.fetch_google_shopping(kw)
        
        # Normalize gathered API data
        search_count = search_raw.get("search_information", {}).get("total_results", 0)
        if isinstance(search_count, str):
            search_count = int("".join(filter(str.isdigit, search_count)) or "0")
            
        organic_results = search_raw.get("organic_results", [])
        top_search_results = []
        for res in organic_results[:5]:
            top_search_results.append({
                "title": res.get("title") or "",
                "snippet": res.get("snippet") or ""
            })
            
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
        if not top_search_results:
            warnings.append("Search data unavailable")
            
        market_data = {
            "search_results_count": search_count,
            "top_search_results": top_search_results,
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


