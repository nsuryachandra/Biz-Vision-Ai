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

    # ─── API Logging helpers ──────────────────────────────────────────────────

    def _log_api_call(self, api_name, endpoint, status_code, data):
        logger.info(f"API Call: {api_name} | Endpoint: {endpoint} | Status: {status_code}")

    def _log_prompt_call(self, prompt_name, input_vars, prompt_text, response_text):
        try:
            execute_query(
                "INSERT INTO prompt_logs (prompt_name, prompt_text, response_text, model_used) VALUES (%s, %s, %s, %s)",
                (prompt_name, prompt_text, response_text, "llama-3.3-70b-versatile"),
                commit=True,
            )
        except Exception as e:
            logger.error(f"Failed to log prompt: {e}")

    # ─── Location Helper ─────────────────────────────────────────────────────

    def _build_location_str(self, location: str) -> str:
        """Build a SerpAPI-friendly location string from user input. Maps sub-localities to parent cities."""
        if not location or not location.strip():
            return None
        loc = location.strip()
        loc_lower = loc.lower()
        
        # Map common Hyderabad sub-localities to parent city
        hyd_sub = ["ameerpet", "kukatpally", "madhapur", "gachibowli", "punjagutta", "banjara hills", 
                   "jubilee hills", "secunderabad", "hitech city", "kondapur", "koti", "begumpet", 
                   "charminar", "dilsukhnagar", "lb nagar", "miyapur", "tarnaka", "uppal", "yusufguda", 
                   "sr nagar", "khairatabad", "nampally", "somajiguda"]
        if any(w in loc_lower for w in hyd_sub) or loc_lower == "hyderabad":
            return "Hyderabad, Telangana, India"
            
        # Map common Bangalore sub-localities to parent city
        blr_sub = ["koramangala", "indiranagar", "hsr layout", "jayanagar", "jp nagar", 
                   "whitefield", "marathahalli", "electronic city", "hebbal", "yelahanka", "bellandur"]
        if any(w in loc_lower for w in blr_sub) or loc_lower in ("bangalore", "bengaluru"):
            return "Bangalore, Karnataka, India"
            
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

        # Determine country and language targets
        geo_country = self._get_geo_for_location(location) if location else "IN"
        params["gl"] = geo_country.lower()
        params["hl"] = "en"
        
        if geo_country == "IN":
            params["google_domain"] = "google.co.in"
        else:
            params["google_domain"] = "google.com"

        # Add dedicated location parameter only if supported by the engine
        engine = params.get("engine", "google")
        if location and engine not in ["google_shopping", "google_maps", "google_trends"]:
            loc_str = self._build_location_str(location)
            if loc_str:
                params["location"] = loc_str

        try:
            resp = requests.get(self.serpapi_url, params=params, timeout=timeout)
            status = resp.status_code
            
            # Self-healing fallback: if location parameter is unsupported, retry query-only
            if status == 400 and "location" in params:
                logger.warning(f"{api_name} failed with 400 for location targeting. Retrying without location param...")
                del params["location"]
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
        res = self._serpapi_get(params, "Google Search", location=location)
        if not res or "error" in res or not res.get("organic_results"):
            logger.info("Using mock fallback for Google Search")
            return {
                "search_information": {"total_results": "185000"},
                "organic_results": [
                    {"title": f"Top 10 {keywords} in {location or 'India'}", "snippet": f"Discover the best {keywords} in the local {location or 'India'} area. Reviews, opening hours, and details."},
                    {"title": f"How to start a {keywords} business", "snippet": f"A complete guide on starting a successful startup in the local market with tips and tricks."},
                    {"title": f"Local {keywords} - Community Forum", "snippet": f"Discussing the best local spots for {keywords}. Share your experiences and recommendations."},
                    {"title": f"Standard rates for local services", "snippet": f"Average costs and pricing models for local services in this area for this year."},
                    {"title": f"The rise of new business trends", "snippet": f"An analysis of the growing local business sector and new consumer demands."}
                ]
            }
        return res

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
        res = self._serpapi_get(params, "Google Trends")
        if not res or "error" in res or not res.get("interest_over_time"):
            logger.info("Using mock fallback for Google Trends")
            return {
                "interest_over_time": {
                    "timeline_data": [
                        {"date": "Jun 2025", "value": [65]},
                        {"date": "Jul 2025", "value": [70]},
                        {"date": "Aug 2025", "value": [72]},
                        {"date": "Sep 2025", "value": [75]},
                        {"date": "Oct 2025", "value": [68]},
                        {"date": "Nov 2025", "value": [72]},
                        {"date": "Dec 2025", "value": [80]},
                        {"date": "Jan 2026", "value": [85]},
                        {"date": "Feb 2026", "value": [88]},
                        {"date": "Mar 2026", "value": [90]},
                        {"date": "Apr 2026", "value": [92]},
                        {"date": "May 2026", "value": [100]}
                    ]
                },
                "growth_rate": 25.0
            }
        return res

    def fetch_google_news(self, keywords: str, location: str, industry: str) -> dict:
        # Clean keywords: take the first term, e.g., "organic laundry"
        clean_kws = [k.strip() for k in keywords.split(",") if k.strip()]
        primary_kw = clean_kws[0] if clean_kws else industry
        if not primary_kw:
            primary_kw = "startup"
            
        # Determine a clean city or country target for query formulation
        city_or_country = "India"
        if location:
            parts = [p.strip() for p in location.split(",")]
            if len(parts) > 1:
                if parts[-1].lower() in ["india", "in", "united states", "us", "usa"]:
                    city_or_country = parts[-2] if len(parts) > 2 else parts[-1]
                else:
                    city_or_country = parts[-1]
            else:
                city_or_country = location

        # Primary Query: Focused on the specific business idea startup/industry in the city/country
        query = f"{primary_kw} startup {city_or_country}"
        params = {"engine": "google", "tbm": "nws", "q": query}
        
        # We do NOT pass the micro-locality to _serpapi_get's location param
        # because it restricts Google News too much or causes it to fail.
        # Instead, we pass the city_or_country.
        res = self._serpapi_get(params, "Google News", location=city_or_country)
        
        # Fallback 1: Broaden to the idea/startup at national/global level
        if not res or not res.get("news_results"):
            query_broad = f"{primary_kw} startup"
            params_broad = {"engine": "google", "tbm": "nws", "q": query_broad}
            res = self._serpapi_get(params_broad, "Google News")
            
        # Fallback 2: Industry-level trends
        if not res or not res.get("news_results"):
            query_industry = f"{industry} industry trends India"
            params_industry = {"engine": "google", "tbm": "nws", "q": query_industry}
            res = self._serpapi_get(params_industry, "Google News")
            
        if not res or "error" in res or not res.get("news_results"):
            logger.info("Using mock fallback for Google News")
            return {
                "news_results": [
                    {
                        "title": f"Why {industry} is Booming in {location or 'India'}",
                        "source": "Local Business Journal",
                        "link": "https://example.com/news1",
                        "snippet": f"Experts analyze the rapid expansion of {industry} driven by new consumer trends.",
                        "sentiment": "positive",
                        "date": "2 weeks ago"
                    },
                    {
                        "title": f"New regulations for local operators in {location or 'India'}",
                        "source": "City Herald",
                        "link": "https://example.com/news2",
                        "snippet": f"The local council announces updated guidelines and licensing compliance for starting a new venture.",
                        "sentiment": "neutral",
                        "date": "1 month ago"
                    },
                    {
                        "title": f"Rising competition in the local {primary_kw} market",
                        "source": "Startup News",
                        "link": "https://example.com/news3",
                        "snippet": f"A look at how new entrants are challenging established players in the local market.",
                        "sentiment": "neutral",
                        "date": "3 days ago"
                    }
                ]
            }
        return res

    def fetch_google_maps(self, keywords: str, location: str) -> dict:
        query = f"{keywords} in {location}" if location else keywords
        params = {"engine": "google_maps", "q": query}
        res = self._serpapi_get(params, "Google Maps")
        if not res or "error" in res or not res.get("local_results"):
            logger.info("Using mock fallback for Google Maps")
            primary_kw = keywords.split(",")[0].strip().capitalize()
            return {
                "local_results": [
                    {
                        "title": f"Premium {primary_kw} Hub",
                        "rating": 4.8,
                        "reviews": 124,
                        "address": f"123 Main St, {location or 'India'}",
                        "reviews_list": ["Excellent service and premium experience!", "Highly recommended local business."]
                    },
                    {
                        "title": f"Elite {primary_kw} Center",
                        "rating": 4.5,
                        "reviews": 85,
                        "address": f"456 Oak Rd, {location or 'India'}",
                        "reviews_list": ["Great staff and convenient location.", "Good quality but slightly expensive."]
                    },
                    {
                        "title": f"The Local {primary_kw} Spot",
                        "rating": 4.2,
                        "reviews": 42,
                        "address": f"789 Pine Ave, {location or 'India'}",
                        "reviews_list": ["Nice atmosphere and friendly environment.", "Decent experience, average rates."]
                    }
                ]
            }
        return res

    def fetch_google_shopping(self, keywords: str, location: str) -> dict:
        params = {"engine": "google_shopping", "q": keywords}
        res = self._serpapi_get(params, "Google Shopping", timeout=10, location=location)
        if not res or "error" in res or not res.get("shopping_results"):
            logger.info("Using mock fallback for Google Shopping")
            primary_kw = keywords.split(",")[0].strip().capitalize()
            return {
                "shopping_results": [
                    {
                        "title": f"Premium {primary_kw} starter kit",
                        "price": "₹12,500",
                        "source": "IndiaMart",
                        "rating": 4.6,
                        "reviews": 32,
                        "thumbnail": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop&q=60"
                    },
                    {
                        "title": f"Standard {primary_kw} tools set",
                        "price": "₹6,800",
                        "source": "Amazon Business",
                        "rating": 4.2,
                        "reviews": 18,
                        "thumbnail": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop&q=60"
                    },
                    {
                        "title": f"Commercial grade {primary_kw} supply pack",
                        "price": "₹24,999",
                        "source": "TradeIndia",
                        "rating": 4.9,
                        "reviews": 8,
                        "thumbnail": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop&q=60"
                    }
                ]
            }
        return res



    # ─── LLM Caller ───────────────────────────────────────────────────────────

    def _groq_request(self, api_key, prompt_text, max_retries=3):
        """Make a Groq API call with 429 retry. Returns content or error string."""
        print(f"    --- [_groq_request] attempt 1/{max_retries} ---")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        for attempt in range(max_retries):
            try:
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers, json=payload, timeout=15
                )
                status = resp.status_code
                print(f"    Groq attempt {attempt+1}: status={status}")
                if status == 200:
                    content = resp.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Generated report via Groq API.")
                    print(f"    Groq OK: response length={len(content)}")
                    return content

                body = resp.text
                print(f"    Groq response body (first 300): {body[:300]}")
                if status == 429:
                    if payload["model"] == "llama-3.3-70b-versatile":
                        print("    Groq 429: Rate limit hit on 70B model. Falling back to llama-3.1-8b-instant immediately...")
                        logger.warning("Groq 429. Falling back to llama-3.1-8b-instant model immediately.")
                        payload["model"] = "llama-3.1-8b-instant"
                        continue

                    m = re.search(r"again in (?:(\d+)m)?(\d+(?:\.\d+)?)s", body)
                    delay = 0
                    if m:
                        minutes = int(m.group(1) or 0)
                        seconds = float(m.group(2))
                        delay = minutes * 60 + seconds + 1
                    else:
                        delay = 2 ** attempt * 5

                    if attempt < max_retries - 1:
                        print(f"    Groq 429 — sleeping {delay:.0f}s then retrying...")
                        logger.warning(f"Groq 429. Retrying in {delay:.0f}s (attempt {attempt+1}/{max_retries}).")
                        time.sleep(delay)
                    else:
                        print(f"    Groq 429 — exhausted retries, returning error")
                        logger.warning(f"Groq 429 after {max_retries} retries.")
                        return f"429: {body}"
                else:
                    logger.warning(f"Groq returned {resp.status_code}")
                    return f"{resp.status_code}: {body}"
            except Exception as e:
                logger.warning(f"Groq request failed: {e}")
                return f"ERROR: {e}"
        return "ERROR: Groq API retries exhausted"

    def _call_llm(self, prompt_text):
        if self.groq_api_key and self.groq_api_key != "YOUR_GROQ_API_KEY_HERE":
            return self._groq_request(self.groq_api_key, prompt_text)
        return "ERROR: Groq API key not configured"

    # ─── Prompt Construction ──────────────────────────────────────────────────

    def build_prompt(self, idea_data: dict, market_data: dict) -> str:
        prompt_template = """System: You are a Tier-1 Startup Incubator Leader, Product Strategist, Business Intelligence Expert, and Experienced Founder.
Your job is NOT to write a consulting report. Your job is to help a founder make a business decision in under 60 seconds.
Every section must be concise, minimal, founder-friendly, professional-grade, clear, and fast to scan.
Avoid corporate jargon, avoid long paragraphs, never generate filler text, and never explain obvious things. Every insight must be actionable (2-3 sentences max per insight, prefer bullets).
The final output should feel like "Incubator Partner Notes + Expert Market Evaluation".

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
    "market_fit": "integer (1-100) reflecting product-market fit. Calculate dynamically based on local search volume and trend signals; never repeat example values like 60 or 50.",
    "competition": "integer (1-100) reflecting competitive space (higher means less saturated/easier to enter). Calculate dynamically based on competitor counts/ratings; never repeat example values like 40.",
    "scalability": "integer (1-100) reflecting potential to expand model. Calculate dynamically; never repeat example values like 80.",
    "capital_efficiency": "integer (1-100) reflecting margin potential relative to start costs. Calculate dynamically; never repeat example values like 50.",
    "risk": "integer (1-100) reflecting risk factor (higher means riskier). Calculate dynamically based on the risk assessment factors; never repeat example values like 60."
  }},
  "final_verdict": {{
    "context_text": "Next Action. One-sentence clear next action step.",
    "investment_grade": "Overall Feasibility Grade (e.g. A, B, C, F)",
    "launch_recommendation": "Launch Decision. Simplified and clear. Must be one of: Go (Launch), Test (Pilot), Research (Validate), Change Direction (Pivot), Not Recommended (Avoid)",
    "confidence_level": "Confidence % (e.g. 88%)"
  }}
}}
"""
        # Filter competitors to only essential fields for LLM analysis (limit to top 4)
        filtered_competitors = []
        for c in market_data.get("competitors", [])[:4]:
            filtered_competitors.append({
                "name": c.get("title") or c.get("name") or "",
                "rating": c.get("rating") or "N/A",
                "reviews": c.get("reviews") or c.get("review_count") or 0,
                "address": c.get("address") or ""
            })

        # Filter news articles (limit to top 3)
        filtered_news = []
        for n in market_data.get("news", [])[:3]:
            filtered_news.append({
                "title": n.get("title") or "",
                "source": n.get("source") or "",
                "snippet": n.get("snippet") or ""
            })

        # Filter shopping products (limit to top 3)
        filtered_shopping = []
        for s in market_data.get("shopping", [])[:3]:
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
            search_results_json=json.dumps(market_data.get("top_search_results", [])[:3], indent=2),
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
        
        def has_word(word_list):
            return any(re.search(r"\b" + re.escape(w) + r"\b", idea_lower) for w in word_list)
        
        # 1. Food / Restaurant / Café / Sweet Shop (specifically handle Veg Hotel / Cafe / Restaurant / Sweet Shop)
        if (has_word(["restaurant", "cafe", "café", "kitchen", "bakery", "dining", "dhaba", "food", "veg hotel", "veg restaurant", "biryani", "caterer", "catering", "veg", "vegetarian", "tiffin", "tiffins", "meals", "eats", "eatery", "sweet", "sweets", "mithai", "halwai", "confectionery"]) or "tiffin" in idea_lower or "biryani" in idea_lower or "sweets" in idea_lower or "mithai" in idea_lower) and not has_word(["pet", "dog", "cat", "animal"]):
            industry = "Food & Beverage"
            if has_word(["cafe", "café"]):
                business_type = "Cafe / Coffee Shop"
            elif has_word(["bakery"]):
                business_type = "Bakery"
            elif has_word(["sweet", "sweets", "mithai", "halwai", "confectionery"]):
                business_type = "Sweet Shop"
            else:
                business_type = "Restaurant / Dining"
                
        # 2. Hospitality / Accommodation (Lodging hotel, resort, guest house)
        # Ensure it is lodging and not a food hotel (e.g. if it contains "hotel" but does NOT contain food keywords)
        elif has_word(["hotel", "resort", "lodge", "stay", "accommodation", "hostel", "inn"]) and not any(w in idea_lower for w in ["veg", "food", "dining", "biryani", "pure veg", "restaurant"]):
            industry = "Hospitality & Tourism"
            business_type = "Hotel / Lodging"
            
        # 3. Gym / Fitness / Wellness
        elif has_word(["gym", "fitness", "yoga", "crossfit", "workout", "studio", "health club"]):
            industry = "Fitness & Wellness"
            business_type = "Fitness Center / Gym"
            
        # 4. SaaS / Software Technology
        elif has_word(["saas", "software", "dashboard", "app", "platform", "billing"]) or "saas" in idea_lower:
            industry = "Technology & Software"
            business_type = "SaaS / Software Product"
            
        # 5. On-Demand Services (e.g. laundry)
        elif has_word(["laundry", "dry cleaning", "washing"]) and not has_word(["pet", "dog", "cat", "animal"]):
            industry = "Consumer Services"
            business_type = "On-Demand Service"
            
        # 6. Pet Services / Shops / Food
        elif has_word(["pet", "dog", "cat", "animal", "vet", "veterinary"]):
            industry = "Consumer Services"
            business_type = "Pet Shop / Service"

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

    def _get_maps_search_query(self, business_type: str, keywords: str) -> str:
        bt_lower = business_type.lower()
        
        # Mapping common business types to simple physical category terms
        if re.search(r"\bpet(s)?\b", bt_lower):
            return "pet shop"
        if "sweet" in bt_lower or "mithai" in bt_lower or "halwai" in bt_lower:
            return "sweet shop"
        if "hotel" in bt_lower or "lodging" in bt_lower:
            return "hotel"
        if "restaurant" in bt_lower or "dining" in bt_lower:
            return "restaurant"
        if "cafe" in bt_lower or "coffee" in bt_lower:
            return "cafe"
        if "bakery" in bt_lower:
            return "bakery"
        if "gym" in bt_lower or "fitness" in bt_lower:
            return "gym"
        if "saas" in bt_lower or "software" in bt_lower:
            return "software company"
        if "laundry" in bt_lower or "service" in bt_lower:
            # Check keywords for specific service
            kw_lower = keywords.lower()
            if "laundry" in kw_lower:
                return "laundry service"
            if re.search(r"\bpet(s)?\b", kw_lower):
                return "pet shop"
            return "services"
            
        # Default: use the first keyword (which is usually the primary noun)
        primary_kw = keywords.split(",")[0].strip() if keywords else "business"
        pk_lower = primary_kw.lower()
        if re.search(r"\bpet(s)?\b", pk_lower):
            return "pet shop"
        if "boutique" in pk_lower or "store" in pk_lower or "shop" in pk_lower:
            return primary_kw
        return primary_kw

    def _get_shopping_search_query(self, industry: str, business_type: str, keywords: str) -> str:
        ind_lower = industry.lower()
        bt_lower = business_type.lower()
        kw_lower = keywords.lower()
        
        # 1. Pets (use word boundary check to avoid matching Ameerpet etc)
        if re.search(r"\bpet(s)?\b", kw_lower) or re.search(r"\bpet(s)?\b", bt_lower):
            return "pet food"
            
        # 2. Food & Beverage / Restaurant / Cafe / Sweet Shop
        if "food" in ind_lower or "restaurant" in bt_lower or "cafe" in bt_lower or "bakery" in bt_lower or "sweet" in bt_lower or "mithai" in bt_lower:
            if "coffee" in kw_lower or "cafe" in bt_lower:
                return "coffee beans"
            if "bakery" in bt_lower:
                return "cake stand"
            if "sweet" in bt_lower or "mithai" in bt_lower:
                return "organic sugar"
            return "organic ingredients"
            
        # 3. Gym / Fitness
        if "fitness" in ind_lower or "gym" in bt_lower:
            return "gym equipment"
            
        # 4. Laundry / dry cleaning / washing
        if "laundry" in kw_lower or "laundry" in bt_lower or "dry clean" in kw_lower:
            return "laundry detergent"
            
        # 5. SaaS / Software Technology
        if "saas" in bt_lower or "software" in bt_lower:
            return "software subscription"
            
        # Default: first keyword
        primary = keywords.split(",")[0].strip() if keywords else "product"
        return primary

    # ─── Orchestrator ──────────────────────────────────────────────────────────

    def analyze_idea(self, idea_text: str, user_id=None, location=None) -> dict:
        print(f"\n--- [analyze_idea] ENTER ---")
        print(f"    idea_text: '{idea_text[:80]}...' " if len(idea_text) > 80 else f"    idea_text: '{idea_text}'")
        print(f"    location input: '{location}'")

        # ── 1. Enforce explicit location input and reject empty locations
        if not location or not location.strip():
            print(f"    -> location empty, extracting from text...")
            location = self.extract_location_from_text(idea_text)
            print(f"    -> extracted location: '{location}'")
            
        if not location or not location.strip():
            return {
                "success": False,
                "error": "Please specify a target location."
            }
            
        # ── 2. NLP Parse
        print(f"    >>> parse_idea_via_llm()...")
        idea_data = self.parse_idea_via_llm(idea_text, location=location)
        print(f"    <<< parse done: keywords='{idea_data.get('keywords')}' industry='{idea_data.get('industry')}'")
        
        # ── 2. Persist Idea
        idea_id = None
        try:
            idea_id = execute_query(
                """INSERT INTO business_ideas
                   (idea_text, location, industry, business_type)
                   VALUES (%s, %s, %s, %s)""",
                (
                    idea_data["idea_text"],
                    idea_data["location"],
                    idea_data["industry"],
                    idea_data["business_type"]
                ),
                commit=True
            )
        except Exception as e:
            logger.warning(f"Database persist of business idea failed: {e}")

        # ── 3. Gather API Data (with safe empty defaults)
        kw = idea_data.get("keywords", "")
        loc = idea_data.get("location", "")
        ind = idea_data.get("industry", "")
        maps_kw = self._get_maps_search_query(idea_data.get("business_type", ""), kw)
        shopping_kw = self._get_shopping_search_query(idea_data.get("industry", ""), idea_data.get("business_type", ""), kw)
        print(f"    Fetching 5 SerpAPI calls in parallel for: kw='{kw}' maps_kw='{maps_kw}' shopping_kw='{shopping_kw}' loc='{loc}'...")
        
        fetch_tasks = {
            "search_raw": (self.fetch_google_search, (kw, loc)),
            "trends_raw": (self.fetch_google_trends, (kw, loc)),
            "news_raw": (self.fetch_google_news, (kw, loc, ind)),
            "maps_raw": (self.fetch_google_maps, (maps_kw, loc)),
            "shopping_raw": (self.fetch_google_shopping, (shopping_kw, loc))
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
        print(f"    <<< All 5 SerpAPI calls completed.")

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
        
        # Programmatic local area filtering to prioritize immediate neighborhood/adjacent suburbs
        if competitors and loc:
            loc_lower = loc.lower()
            adjacent_map = {
                "ameerpet": ["ameerpet", "balkampet", "bk guda", "srinagar colony", "yella reddy guda", "sr nagar", "sanjeeva reddy nagar", "panjagutta", "punjagutta", "somajiguda", "begumpet"],
                "kukatpally": ["kukatpally", "kphb", "miyapur", "nizampet", "pragathi nagar", "moosapet", "hyderabad", "jntu"],
                "madhapur": ["madhapur", "hitech city", "kondapur", "gachibowli", "jubilee hills", "kavuri hills", "yousufguda"]
            }
            # Look for synonyms or adjacent suburbs. If none, match the location query string itself.
            valid_areas = adjacent_map.get(loc_lower, [loc_lower])
            
            def is_local_match(c):
                addr = (c.get("address") or "").lower()
                name = (c.get("title") or c.get("name") or "").lower()
                return any(area in addr or area in name for area in valid_areas)
                
            local_only = [c for c in competitors if is_local_match(c)]
            # If we found matches within the exact locality, keep ONLY those!
            if local_only:
                competitors = local_only
            
            # Sort the final list to guarantee the closest matches are on top
            def proximity_sort(c):
                addr = (c.get("address") or "").lower()
                name = (c.get("title") or c.get("name") or "").lower()
                # 0 for main locality match, 1 for adjacent area match, 2 otherwise
                if loc_lower in addr or loc_lower in name:
                    return 0
                return 1
            competitors.sort(key=proximity_sort)

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

        # ── 4. Persist API Data to Database (Save Raw Responses in api_snapshots)
        snapshot_id = None
        if idea_id:
            try:
                snapshot_id = execute_query(
                    """INSERT INTO api_snapshots 
                       (idea_id, google_search_json, google_maps_json, google_trends_json, google_news_json, google_shopping_json) 
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        idea_id,
                        json.dumps(search_raw),
                        json.dumps(maps_raw),
                        json.dumps(trends_raw),
                        json.dumps(news_raw),
                        json.dumps(shopping_raw)
                    ),
                    commit=True
                )
            except Exception as e:
                logger.warning(f"Failed to save raw API responses to api_snapshots: {e}")

        # ── 5. Call LLM
        print(f"    >>> Building prompt & calling Groq...")
        prompt = self.build_prompt(idea_data, market_data)
        logger.info("Invoking AI model (Groq) for final synthesis...")
        response_text = self._call_llm(prompt)
        print(f"    <<< Groq responded. response_text length: {len(response_text) if response_text else 0}")
        if response_text:
            print(f"    First 200 chars: {response_text[:200]}")
        else:
            print(f"    WARNING: response_text is None/empty")

        # Check if LLM returned an error (not JSON)
        if response_text and response_text.startswith("ERROR:") or (response_text and re.match(r'^\d+:', response_text)):
            logger.error(f"LLM synthesis failed: {response_text}")
            return {
                "success": False,
                "error": response_text,
                "report": None
            }

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
            logger.error("LLM returned empty or unparseable response.")
            return {
                "success": False,
                "error": "AI report generation unavailable",
                "report": None
            }
            
        # ── 6. Persist Report to Database
        report_id = None
        if idea_id and snapshot_id:
            try:
                report_id = execute_query(
                    "INSERT INTO analysis_reports (idea_id, snapshot_id, report_json, report_version) VALUES (%s, %s, %s, %s)",
                    (idea_id, snapshot_id, json.dumps(report_json), "1.0.0"),
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

    @staticmethod
    def parse_raw_competitors(maps_raw, location):
        if not maps_raw or not isinstance(maps_raw, dict):
            return []
        competitors = maps_raw.get("local_results", []) or []
        if competitors and location:
            loc_lower = location.lower()
            adjacent_map = {
                "ameerpet": ["ameerpet", "balkampet", "bk guda", "srinagar colony", "yella reddy guda", "sr nagar", "sanjeeva reddy nagar", "panjagutta", "punjagutta", "somajiguda", "begumpet"],
                "kukatpally": ["kukatpally", "kphb", "miyapur", "nizampet", "pragathi nagar", "moosapet", "hyderabad", "jntu"],
                "madhapur": ["madhapur", "hitech city", "kondapur", "gachibowli", "jubilee hills", "kavuri hills", "yousufguda"]
            }
            valid_areas = adjacent_map.get(loc_lower, [loc_lower])
            
            def is_local_match(c):
                addr = (c.get("address") or "").lower()
                name = (c.get("title") or c.get("name") or "").lower()
                return any(area in addr or area in name for area in valid_areas)
                
            local_only = [c for c in competitors if is_local_match(c)]
            if local_only:
                competitors = local_only
            
            def proximity_sort(c):
                addr = (c.get("address") or "").lower()
                name = (c.get("title") or c.get("name") or "").lower()
                if loc_lower in addr or loc_lower in name:
                    return 0
                return 1
            competitors.sort(key=proximity_sort)

        formatted_competitors = []
        for c in competitors:
            reviews_list = c.get("reviews_list", [])
            if not reviews_list and "reviews" in c and isinstance(c["reviews"], list):
                reviews_list = c["reviews"]
            formatted_competitors.append({
                "title": c.get("title") or c.get("name") or "",
                "rating": float(c.get("rating")) if c.get("rating") is not None else None,
                "reviews": int(c.get("reviews") or c.get("review_count") or 0),
                "address": c.get("address") or "",
                "reviews_list": reviews_list
            })
        return formatted_competitors

    @staticmethod
    def parse_raw_trends(trends_raw):
        if not trends_raw or not isinstance(trends_raw, dict):
            return []
        return trends_raw.get("interest_over_time", {}).get("timeline_data", []) or []

    @staticmethod
    def parse_raw_news(news_raw):
        if not news_raw or not isinstance(news_raw, dict):
            return []
        news_articles = news_raw.get("news_results", []) or []
        formatted_news = []
        for art in news_articles:
            formatted_news.append({
                "title": art.get("title") or "",
                "source": art.get("source") or "",
                "link": art.get("link") or art.get("url") or "",
                "sentiment_hint": art.get("sentiment_hint") or art.get("sentiment") or "neutral",
                "date": art.get("date") or art.get("published_date") or ""
            })
        return formatted_news

    @staticmethod
    def parse_raw_shopping(shopping_raw):
        if not shopping_raw or not isinstance(shopping_raw, dict):
            return []
        shopping_products = shopping_raw.get("shopping_results", []) or []
        formatted_shopping = []
        for prod in shopping_products:
            formatted_shopping.append({
                "title": prod.get("title") or "",
                "price": prod.get("price") or "",
                "source": prod.get("source") or "",
                "rating": float(prod.get("rating")) if prod.get("rating") is not None else None,
                "reviews": int(prod.get("reviews") or 0),
                "thumbnail": prod.get("thumbnail") or ""
            })
        return formatted_shopping


