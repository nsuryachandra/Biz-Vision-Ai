import re
import json
import logging
import requests
import time
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import Config
from db import execute_query

logger = logging.getLogger(__name__)

class MarketIntelligenceService:
    def __init__(self):
        self.serpapi_key = Config.SERPAPI_KEY
        self.serpapi_url = "https://serpapi.com/search"
        self.groq_api_key = Config.GROQ_API_KEY
        self.groq_api_key_backup = getattr(Config, "GROQ_API_KEY_1", None)

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

    # ─── Location Helper ─────────────────────────────────────────────────────

    def _build_location_str(self, location: str) -> str:
        """Build a SerpAPI-friendly location string from user input. No hardcoded locality map."""
        if not location or not location.strip():
            return None
        loc = location.strip()
        loc_lower = loc.lower()
        # If it already includes country/state/city info, use as-is
        if any(c in loc_lower for c in [",", "india", "telangana", "andhra",
                                         "karnataka", "tamil", "kerala", "maharashtra",
                                         "gujarat", "rajasthan", "delhi", "mumbai",
                                         "bangalore", "hyderabad", "chennai", "kolkata"]):
            return loc
        # Append India so Google resolves "Ameerpet" → Ameerpet, Telangana, India
        return f"{loc}, India"

    def _get_geo_for_location(self, location: str) -> str:
        """Return a country-level geo code (2-letter) for Google Trends.
        Defaults to IN for any Indian locality (no hardcoded list needed)."""
        if not location:
            return None
        loc_lower = location.lower()
        # Non-India countries — explicit check
        if any(w in loc_lower for w in ["us", "united states", "usa"]):
            return "US"
        if any(w in loc_lower for w in ["uk", "united kingdom", "london", "england", "britain"]):
            return "GB"
        if any(w in loc_lower for w in ["ca", "canada"]):
            return "CA"
        if any(w in loc_lower for w in ["au", "australia"]):
            return "AU"
        # Default to India (primary use case — "Punjagutta", "ameerpet", "Gachibowli" all resolve here)
        return "IN"

    # ─── SerpAPI Data Fetchers ────────────────────────────────────────────────

    def _serpapi_get(self, params, api_name, timeout=8, location=None):
        if not self.serpapi_key or self.serpapi_key == "YOUR_SERPAPI_KEY_HERE":
            logger.warning(f"{api_name} skipped: SerpAPI key not configured.")
            return {}

        params["api_key"] = self.serpapi_key

        # Add dedicated location parameter so SerpAPI uses Google's geo-targeting
        if location:
            loc_str = self._build_location_str(location)
            if loc_str:
                params["location"] = loc_str
                params["google_domain"] = "google.co.in"

        try:
            resp = requests.get(self.serpapi_url, params=params, timeout=timeout)
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
        query = f"{keywords} near {location}" if location else keywords
        params = {"engine": "google", "q": query}
        return self._serpapi_get(params, "Google Search", location=location)

    def fetch_google_trends(self, keywords: str, location: str) -> dict:
        topic = keywords.split(",")[0].strip()
        query = f"{location} {topic}"  # keep location in q for Trends context
        params = {
            "engine": "google_trends",
            "q": query,
            "date": "today 12-m"
        }
        geo = self._get_geo_for_location(location)
        if geo:
            params["geo"] = geo
        # Don't pass location to _serpapi_get — Trends doesn't support free-form location param
        return self._serpapi_get(params, "Google Trends")

    def fetch_google_news(self, keywords: str, location: str, industry: str) -> dict:
        query = f"{keywords} near {location}" if location else keywords
        params = {"engine": "google", "tbm": "nws", "q": query}
        res = self._serpapi_get(params, "Google News", location=location)
        if not res or not res.get("news_results"):
            fallback_query = f"{industry} in {location}" if location else industry
            fallback_params = {"engine": "google", "tbm": "nws", "q": fallback_query}
            res = self._serpapi_get(fallback_params, "Google News", location=location)
        return res

    def fetch_google_maps(self, keywords: str, location: str) -> dict:
        query = f"{keywords} in {location}" if location else keywords
        params = {"engine": "google_maps", "q": query}
        return self._serpapi_get(params, "Google Maps", location=location)

    def fetch_google_shopping(self, keywords: str, location: str) -> dict:
        topic = keywords.split(",")[0].strip()
        query = f"{topic} in {location}" if location else topic
        params = {"engine": "google_shopping", "q": query}
        shopping_data = self._serpapi_get(params, "Google Shopping", timeout=10, location=location)
        if not shopping_data or not shopping_data.get("shopping_results"):
            fallback_params = {"engine": "google_shopping", "q": topic}
            return self._serpapi_get(fallback_params, "Google Shopping", timeout=10, location=location)
        return shopping_data



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
                resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=15)
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
                resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=15)
                if resp.status_code == 200:
                    response_content = resp.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Generated intelligence report via backup Groq API.")
                else:
                    logger.warning(f"Backup Groq returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Backup Groq failed: {e}")
        return response_content

    # ─── Prompt Construction ──────────────────────────────────────────────────

    def build_prompt(self, idea_data: dict, market_data: dict) -> str:
        prompt_template = """System: You are a Tier-1 Venture Capital Partner, Startup Founder, Product Strategist, and Business Intelligence Expert.
Your job is NOT to write a consulting report. Your job is to help a founder make a business decision in under 60 seconds.
Every section must be concise, minimal, founder-friendly, investor-grade, clear, and fast to scan.
Avoid corporate jargon, avoid long paragraphs, never generate filler text, and never explain obvious things. Every insight must be actionable (2-3 sentences max per insight, prefer bullets).
The final output should feel like "PitchBook + YC Partner Notes + Shark Tank Evaluation".

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

CRITICAL RULES:
- You must ONLY use the real competitor names, addresses, review counts, news titles, sources, and shopping prices provided in the API data.
- If no competitors are provided, report that no local competitors were found in this region. Do not invent any competitor names, reviews, ratings, news articles, or shopping items.
- Return a single, valid JSON object matching this structure EXACTLY. No comments, no extra characters.

{{
  "executive_summary": {{
    "title": "Concept Name | Positioning Statement | One-Line Tagline. DO NOT repeat the user idea. Example: 'UrbanFit Hub | High-End Gym | Elevate Your Daily Motion'",
    "business_summary": "Main Business Type and brief description. Maximum 1 sentence.",
    "one_paragraph_verdict": "Launch Recommendation. Maximum 1 sentence.",
    "key_opportunity": "Main Opportunity. Maximum 1 sentence.",
    "biggest_challenge": "Main Challenge. Maximum 1 sentence."
  }},
  "market_overview": {{
    "search_demand": "Demand Level: High/Medium/Low + one concise explanation.",
    "trend_direction": "Trend Direction: High/Medium/Low + one concise explanation.",
    "market_maturity": "Market Maturity: High/Medium/Low + one concise explanation."
  }},
  "competitor_intelligence": {{
    "market_gaps": "Top Competitor name, rating, review count, and biggest market gap. Maximum 15 words."
  }},
  "customer_intelligence": {{
    "customer_persona": "Target Audience. No long persona descriptions.",
    "pain_points": ["Biggest Pain Point 1", "Biggest Pain Point 2"],
    "buying_behavior": "Buying Trigger. Maximum 15 words.",
    "spending_patterns": "Typical Spending Range. Maximum 15 words."
  }},
  "industry_trends": {{
    "news_analysis": "News Sentiment. Maximum 15 words.",
    "trend_analysis": "Macro Trend. Maximum 15 words.",
    "emerging_changes": "Emerging Standards. Maximum 15 words."
  }},
  "opportunity_analysis": {{
    "why_work": "Why This Can Work. Maximum 20 words.",
    "untapped_opportunities": ["Untapped Opportunity 1 (max 20 words)", "Untapped Opportunity 2 (max 20 words)"],
    "premium_positioning": "Premium Positioning Angle. Maximum 20 words."
  }},
  "revenue_model": {{
    "revenue_streams": ["Primary Revenue stream description", "Secondary Revenue stream. No memberships. No subscriptions unless strongly relevant."],
    "upsells": "Growth Revenue mechanism. Maximum 15 words.",
    "memberships": "N/A or very short note under 12 words.",
    "subscriptions": "N/A or very short note under 12 words."
  }},
  "cost_capital_analysis": {{
    "estimated_startup_cost": "Startup Budget Range in Indian Rupees (₹) (e.g. ₹5,00,000 - ₹10,00,000). Always output in Indian Rupees (₹) using Indian formatting.",
    "operating_cost": "Capital Requirement / Monthly cost in Indian Rupees (₹) (e.g. ₹1,00,000 - ₹2,00,000 per month). Always output in Indian Rupees (₹) using Indian formatting.",
    "recommended_capital": "Total funding suggested for early growth in Indian Rupees (₹) (e.g. ₹15,00,000 - ₹25,00,000). Always output in Indian Rupees (₹) using Indian formatting.",
    "runway": "Break-even Estimate. Maximum 15 words.",
    "context_text": "Risk Category. Maximum 10 words."
  }},
  "swot_analysis": {{
    "strengths": ["Strength 1 (under 5 words)", "Strength 2 (under 5 words)"],
    "weaknesses": ["Weakness 1 (under 5 words)", "Weakness 2 (under 5 words)"],
    "opportunities": ["Opportunity 1 (under 5 words)", "Opportunity 2 (under 5 words)"],
    "threats": ["Threat 1 (under 5 words)", "Threat 2 (under 5 words)"]
  }},
  "risk_assessment": {{
    "market_risks": "Market Risk: Low/Medium/High + one-line reason.",
    "competition_risks": "Competition Risk: Low/Medium/High + one-line reason.",
    "operational_risks": "Operational Risk: Low/Medium/High + one-line reason.",
    "legal_risks": "Compliance Risk: Low/Medium/High + one-line reason."
  }},
  "scenario_planning": {{
    "best_case": "Best Case in Indian Rupees (₹) (e.g. ₹8,00,000/mo). Always output in Indian Rupees (₹) using Indian formatting.",
    "expected_case": "Expected Case in Indian Rupees (₹) (e.g. ₹4,00,000/mo). Always output in Indian Rupees (₹) using Indian formatting.",
    "worst_case": "Worst Case in Indian Rupees (₹) (e.g. ₹1,50,000/mo). Always output in Indian Rupees (₹) using Indian formatting."
  }},
  "launch_roadmap": {{
    "week_1_2": ["Step 1 (max 12 words)", "Step 2 (max 12 words)"],
    "week_3_4": ["Step 1 (max 12 words)", "Step 2 (max 12 words)"],
    "month_2": ["Step 1 (max 12 words)", "Step 2 (max 12 words)"],
    "month_3": ["Step 1 (max 12 words)", "Step 2 (max 12 words)"]
  }},
  "founder_decision_engine": {{
    "market_fit": 85,
    "competition": 75,
    "scalability": 90,
    "capital_efficiency": 80,
    "risk": 65
  }},
  "final_verdict": {{
    "context_text": "Next Action. One-sentence clear next action step.",
    "investment_grade": "Overall Grade (e.g. A, B, C, F)",
    "launch_recommendation": "Launch Decision. Must be one of: Proceed, Pilot First, Validate Further, Pivot, Reject",
    "confidence_level": "Confidence % (e.g. 88%)"
  }}
}}
"""
        # Filter competitors to only essential fields for LLM analysis
        filtered_competitors = []
        for c in market_data.get("competitors", []):
            filtered_competitors.append({
                "name": c.get("title") or c.get("name") or "",
                "rating": c.get("rating") or "N/A",
                "reviews": c.get("reviews") or c.get("review_count") or 0,
                "address": c.get("address") or ""
            })

        # Filter news articles
        filtered_news = []
        for n in market_data.get("news", []):
            filtered_news.append({
                "title": n.get("title") or "",
                "source": n.get("source") or "",
                "snippet": n.get("snippet") or ""
            })

        # Filter shopping products
        filtered_shopping = []
        for s in market_data.get("shopping", []):
            filtered_shopping.append({
                "title": s.get("title") or "",
                "price": s.get("price") or s.get("price_str") or "N/A",
                "source": s.get("source") or s.get("merchant") or ""
            })

        return prompt_template.format(
            idea_text=idea_data["idea_text"],
            keywords=idea_data["keywords"],
            location=idea_data["location"],
            industry=idea_data["industry"],
            business_type=idea_data["business_type"],
            sub_category=idea_data.get("sub_category", "N/A"),
            search_results_json=json.dumps(market_data.get("top_search_results", []), indent=2),
            trends_growth_rate=market_data["trends"]["growth_rate"],
            competitors_json=json.dumps(filtered_competitors, indent=2),
            news_json=json.dumps(filtered_news, indent=2),
            shopping_json=json.dumps(filtered_shopping, indent=2),
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

CLASSIFICATION ACCURACY DIRECTIVES:
1. Industry: Determine the macro industry sector (e.g. "Hospitality", "Food & Beverage", "Fitness & Wellness", "Technology", "Retail", "Healthcare", "Education").
2. Business Type: Determine the specific business model/facility type (e.g. "Hotel", "Restaurant", "Cafe", "Gym", "SaaS", "E-commerce"). DO NOT use generic terms like "Brick and Mortar" or "Brick-and-mortar retail" or "Physical store". Be specific (e.g. use "Hotel" for hotels, "Restaurant" for food joints, "SaaS" for software, etc.).
3. Sub-Category: Specify the niche or category extension (e.g. "Veg Fine Dining", "Luxury Resort", "Boutique Cafe", "CrossFit Box").

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

        industry = parsed.get("industry") or "General Business"
        business_type = parsed.get("business_type") or "General Service"
        sub_category = parsed.get("sub_category") or "General Niche"

        # Deterministic corrections for common local/niche business models (e.g. South Indian "Hotel" meaning Restaurant, or general Hotels/SaaS/Gyms)
        idea_lower = idea_text.lower()
        
        # 1. Food / Restaurant / Café (specifically handle Veg Hotel / Cafe / Restaurant)
        if any(w in idea_lower for w in ["restaurant", "cafe", "café", "kitchen", "bakery", "dining", "dhaba", "food", "veg hotel", "veg restaurant", "biryani", "caterer", "catering", "veg", "vegetarian", "tiffin", "tiffins", "meals", "eats", "eatery"]):
            industry = "Food & Beverage"
            if "cafe" in idea_lower or "café" in idea_lower:
                business_type = "Cafe / Coffee Shop"
            elif "bakery" in idea_lower:
                business_type = "Bakery"
            else:
                business_type = "Restaurant / Dining"
                
        # 2. Hospitality / Accommodation (Lodging hotel, resort, guest house)
        # Ensure it is lodging and not a food hotel (e.g. if it contains "hotel" but does NOT contain food keywords)
        elif any(w in idea_lower for w in ["hotel", "resort", "lodge", "stay", "accommodation", "hostel", "inn"]) and not any(w in idea_lower for w in ["veg", "food", "dining", "biryani", "pure veg", "restaurant"]):
            industry = "Hospitality & Tourism"
            business_type = "Hotel / Lodging"
            
        # 3. Gym / Fitness / Wellness
        elif any(w in idea_lower for w in ["gym", "fitness", "yoga", "crossfit", "workout", "studio", "health club"]):
            industry = "Fitness & Wellness"
            business_type = "Fitness Center / Gym"
            
        # 4. SaaS / Software Technology
        elif any(w in idea_lower for w in ["saas", "software", "dashboard", "app", "platform", "billing"]):
            industry = "Technology & Software"
            business_type = "SaaS / Software Product"
            
        # 5. On-Demand Services (e.g. laundry)
        elif any(w in idea_lower for w in ["laundry", "dry cleaning", "washing"]):
            industry = "Consumer Services"
            business_type = "On-Demand Service"

        return {
            "idea_text": idea_text,
            "keywords": keywords,
            "location": location,
            "industry": industry,
            "business_type": business_type,
            "sub_category": sub_category
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
        
        fetch_tasks = {
            "search_raw": (self.fetch_google_search, (kw, loc)),
            "trends_raw": (self.fetch_google_trends, (kw, loc)),
            "news_raw": (self.fetch_google_news, (kw, loc, ind)),
            "maps_raw": (self.fetch_google_maps, (kw, loc)),
            "shopping_raw": (self.fetch_google_shopping, (kw, loc))
        }

        results = {}
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_key = {
                executor.submit(func, *args): key
                for key, (func, args) in fetch_tasks.items()
            }
            for future in as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    results[key] = future.result()
                except Exception as exc:
                    logger.warning(f"Parallel fetch task {key} failed: {exc}")
                    results[key] = {}

        search_raw = results.get("search_raw", {})
        trends_raw = results.get("trends_raw", {})
        news_raw = results.get("news_raw", {})
        maps_raw = results.get("maps_raw", {})
        shopping_raw = results.get("shopping_raw", {})

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


