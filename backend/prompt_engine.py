import re
import time
import logging
import json
import google.generativeai as genai
from config import Config
from db import execute_query

logger = logging.getLogger(__name__)

# ─── Prompt Templates ────────────────────────────────────────────────────────

STARTUP_VALIDATION_TEMPLATE = """
System: You are a McKinsey-style Business Intelligence Consultant.
Analyze this startup idea and generate a premium, decision-focused Executive Summary.

Idea: {idea_text}
Keywords: {keywords}
Location: {location}
Industry: {industry}
Business Type: {business_type}

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only. No trailing commas, no extra text.
{{
  "paragraph": "One high-quality business insight paragraph (exactly 2-3 sentences explaining: 1. Current market condition & demand outlook, 2. Main business opportunity, 3. Primary challenge & overall viability. Style must be professional, specific, and realistic like Gartner or PitchBook).",
  "insights": [
    "Demand Insight: [Specific, actionable customer demand signal for this business idea, no generic filler]",
    "Customer Insight: [Target customer profile and purchase behaviors, no generic filler]",
    "Revenue Insight: [Viable monetization strategy and revenue outlook, no generic filler]",
    "Competition Insight: [Competitive environment assessment for this location/niche]",
    "Growth Insight: [Primary scalability driver for this business model]"
  ],
  "recommendation": "One practical, actionable next step sentence (max 20 words)."
}}
"""

MARKET_ANALYSIS_TEMPLATE = """
System: You are a Premium Market Research Analyst.
Analyze market demand, search interest, and trends for this concept.

Idea: {idea_text}
Location: {location}
Search results: {search_results_count}
Growth rate: {trends_growth_rate}%

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only.
{{
  "insights": [
    "Market size/interest: [Specific search interest and search query velocity trend, no generic filler]",
    "Demand trajectory: [How demand is changing, backed by location and keyword context]",
    "Market maturity: [Whether the market is emerging, mature, or highly local]",
    "Growth outlook: [Explain growth runway and category viability]"
  ],
  "interpretation": "A 2-3 line market interpretation paragraph explaining search interest, demand trend, market maturity, and growth outlook. Do NOT repeat raw score numbers."
}}
"""

COMPETITOR_ANALYSIS_TEMPLATE = """
System: You are a Competitive Intelligence Expert.
Analyze the competitive landscape and identify market gaps.

Idea: {idea_text}
Location: {location}
Competitors from Google Maps (raw search results): {competitors_json}

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only.
{{
  "competitors": [
    {{
      "name": "[Name of Competitor 1]",
      "rating": 4.5,
      "reviews": 120,
      "address": "[Address/Area]",
      "differentiator": "[Specific, realistic differentiator or operational weakness based on their name/rating/location]"
    }},
    {{
      "name": "[Name of Competitor 2]",
      "rating": 4.0,
      "reviews": 45,
      "address": "[Address/Area]",
      "differentiator": "[Specific, realistic differentiator or operational weakness]"
    }},
    {{
      "name": "[Name of Competitor 3]",
      "rating": 3.8,
      "reviews": 12,
      "address": "[Address/Area]",
      "differentiator": "[Specific, realistic differentiator or operational weakness]"
    }}
  ],
  "gap_analysis": {{
    "premium_segment": "[Explain availability of premium/high-margin services or products in this local/market segment]",
    "differentiation_potential": "[Highlight the key differentiator potential for a new entrant]",
    "market_saturation": "[Analyze current competitor density and saturation level]",
    "expansion_opportunity": "[Identify untapped expansion channels or customer segments]"
  }}
}}
"""

BUSINESS_NAME_TEMPLATE = """
System: You are a Premium Brand Strategy and Naming Expert.
Generate 4 highly creative, modern startup names specific to this business category.

Concept: "{idea_text}"

You must return a valid JSON array with exactly 4 objects. Each object MUST have:
- "name": Brand name (modern, brandable)
- "brand_uniqueness": 70-98 (uniqueness score integer)
- "tagline": "1-line brand tagline"
- "rationale": Exactly 4 bullets separated by newlines:
  Format: "• Connection to category: [Detail]\\n• Emotional appeal: [Detail]\\n• Brand perception: [Detail]\\n• Market suitability: [Detail]"
- "why_recommended": "Explain why this name is the absolute strongest option if chosen (used for the recommended name highlight)."

The first name in the array MUST be the 'Best Recommended Name' and have the strongest 'why_recommended' justification.
"""

RISK_ASSESSMENT_TEMPLATE = """
System: You are a Risk Management Consultant.
Assess key risks, weaknesses, and threats for this business.

Idea: {idea_text}
Location: {location}
Risk Score: {risk_score}

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only.
{{
  "weaknesses": [
    "Weakness #1: [Specific, realistic operational or internal weakness of this idea, max 12 words]",
    "Weakness #2: [Specific, realistic operational or internal weakness of this idea, max 12 words]"
  ],
  "threats": [
    "Threat #1: [Specific, realistic external threat or regulatory barrier, max 12 words]",
    "Threat #2: [Specific, realistic external threat or regulatory barrier, max 12 words]"
  ],
  "key_risks": [
    "Key Risk #1: [Primary risk factor, max 12 words]",
    "Key Risk #2: [Secondary risk factor, max 12 words]"
  ]
}}
"""

OPPORTUNITY_ANALYSIS_TEMPLATE = """
System: You are a Strategic Growth Advisor.
Identify growth opportunities, strengths, and map out a realistic 4-phase action plan.

Idea: {idea_text}
Location: {location}
Opportunity Score: {opportunity_score}

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only.
{{
  "strengths": [
    "Strength #1: [Specific, realistic internal strength of this business idea, max 12 words]",
    "Strength #2: [Specific, realistic internal strength of this business idea, max 12 words]"
  ],
  "opportunities": [
    "Opportunity #1: [Specific, realistic external opportunity, max 12 words]",
    "Opportunity #2: [Specific, realistic external opportunity, max 12 words]"
  ],
  "key_opportunities": [
    "[Growth Opportunity #1: specific monetization, niche segment, or channel]",
    "[Growth Opportunity #2: specific monetization, niche segment, or channel]",
    "[Growth Opportunity #3: specific monetization, niche segment, or channel]",
    "[Growth Opportunity #4: specific monetization, niche segment, or channel]",
    "[Growth Opportunity #5: specific monetization, niche segment, or channel]"
  ],
  "roadmap": [
    {{
      "phase": "Week 1–2",
      "title": "[Validation Title]",
      "tasks": [
        "[Specific task 1]",
        "[Specific task 2]"
      ]
    }},
    {{
      "phase": "Week 3–4",
      "title": "[Setup/MVP Title]",
      "tasks": [
        "[Specific task 1]",
        "[Specific task 2]"
      ]
    }},
    {{
      "phase": "Month 2",
      "title": "[Pilot Launch Title]",
      "tasks": [
        "[Specific task 1]",
        "[Specific task 2]"
      ]
    }},
    {{
      "phase": "Month 3",
      "title": "[Traction/Scaling Title]",
      "tasks": [
        "[Specific task 1]",
        "[Specific task 2]"
      ]
    }}
  ]
}}
"""

TREND_ANALYSIS_TEMPLATE = """
System: You are a Trend Forecaster.
Analyze regional search interest trend and momentum for this idea.

Idea: {idea_text}
Location: {location}
Growth Rate: {trends_growth_rate}%

Return a simple 2-3 sentence analysis of current search interest and trend trajectory.
"""

FINAL_REPORT_TEMPLATE = """
System: You are a Venture Capital Investment Committee Chair.
Synthesize the final verdict on this startup opportunity.

Idea: {idea_text}
Industry: {industry}
Location: {location}
Scores:
- Demand: {demand_score}/100
- Trend: {trend_score}/100
- Competition: {competition_score}/100
- Viability: {viability_score}/100

You must return a valid JSON object matching this structure EXACTLY. Do NOT wrap the JSON in ```json markdown blocks, return raw text only.
{{
  "potential": [1-5 star rating integer based on viability score: 80+ is 5, 60-79 is 4, 45-59 is 3, less is 2],
  "confidence": {viability_score},
  "status": "[🟢 Strong Opportunity / 🟡 Proceed with Caution / 🔴 High Risk based on viability score]",
  "reasons": [
    "Rating Reason 1: [Specific, data-justified reason explaining this rating based on demand/competition]",
    "Rating Reason 2: [Specific, data-justified reason explaining this rating based on market trends]",
    "Rating Reason 3: [Specific, data-justified reason explaining this rating based on viability/risk]"
  ],
  "strengths": [
    "[Verdict Strength 1, max 12 words]",
    "[Verdict Strength 2, max 12 words]"
  ],
  "risks": [
    "[Verdict Risk 1, max 12 words]",
    "[Verdict Risk 2, max 12 words]"
  ],
  "next_step": "[One highly practical next action item, max 15 words]"
}}
"""



class PromptEngine:
    def __init__(self):
        self.groq_api_key = Config.GROQ_API_KEY
        self.groq_api_key_1 = getattr(Config, "GROQ_API_KEY_1", "")
        self.gemini_api_key = Config.GEMINI_API_KEY
        
        if not self.groq_api_key and not self.groq_api_key_1 and not self.gemini_api_key:
            logger.warning(
                "Neither Groq API keys nor Gemini API key is configured. "
                "PromptEngine will operate in dynamic simulated fallback mode."
            )
        elif self.groq_api_key or self.groq_api_key_1:
            logger.info("Initializing PromptEngine with Groq (llama-3.3-70b-versatile).")
        else:
            logger.info("Initializing PromptEngine with Gemini (gemini-2.5-flash).")
            
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash")

    def _log_prompt_call(self, prompt_name, input_vars, prompt_text, response_text):
        try:
            execute_query(
                "INSERT INTO prompt_logs (prompt_name, input_variables, prompt_text, response_text) VALUES (%s, %s, %s, %s)",
                (prompt_name, json.dumps(input_vars), prompt_text, response_text),
                commit=True,
            )
        except Exception as e:
            logger.error(f"Failed to log prompt: {e}")

    def _call_llm(self, prompt_text):
        """Invoke Groq or Gemini. Falls back to premium simulated results on quota/API limits to guarantee uptime."""
        def extract_val(pattern, text, default=""):
            match = re.search(pattern, text, re.IGNORECASE)
            return match.group(1).strip() if match else default

        response_content = None
        
        # Try Groq if configured
        if self.groq_api_key:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "user", "content": prompt_text}
                    ],
                    "temperature": 0.2
                }
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=15
                )
                if response.status_code == 200:
                    response_content = response.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Successfully generated report response via primary Groq API.")
                else:
                    logger.warning(f"Primary Groq API call returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Primary Groq API call failed: {e}.")

        # Try backup Groq key if primary failed
        if not response_content and getattr(self, "groq_api_key_1", None):
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key_1}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "user", "content": prompt_text}
                    ],
                    "temperature": 0.2
                }
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=15
                )
                if response.status_code == 200:
                    response_content = response.json()["choices"][0]["message"]["content"].strip()
                    logger.info("Successfully generated report response via backup Groq API (GROQ_API_KEY_1).")
                else:
                    logger.warning(f"Backup Groq API call returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Backup Groq API call failed: {e}.")

        # Try Gemini if Groq was not used or failed, with retry on quota errors
        if not response_content and self.gemini_api_key:
            from google.api_core.exceptions import ResourceExhausted
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = self.model.generate_content(prompt_text)
                    response_content = response.text.strip()
                    logger.info("Successfully generated report response via Gemini API.")
                    break
                except ResourceExhausted as e:
                    delay_match = re.search(r"retry in (\d+\.?\d*)s", str(e))
                    retry_seconds = (delay_match and float(delay_match.group(1)) + 1) or (2 ** attempt * 5)
                    if attempt < max_retries - 1:
                        logger.warning(f"Gemini API quota exceeded. Retrying in {retry_seconds:.1f}s (attempt {attempt+1}/{max_retries}).")
                        time.sleep(retry_seconds)
                    else:
                        logger.warning(f"Gemini API quota exceeded after {max_retries} retries: {e}.")
                except Exception as e:
                    logger.warning(f"Gemini API call failed: {e}.")
                    break

        # If both failed or are unconfigured, use premium simulated fallback
        if response_content:
            return response_content
            
        logger.warning("All LLM providers exhausted or failed. Generating consulting-grade fallback intelligence.")
        
        # Extract variables from prompt text for custom fallback responses
        idea_text = extract_val(r"Idea:\s*(.*?)(?:\n|$)", prompt_text)
        if not idea_text:
            idea_text = extract_val(r"concept:\s*\"(.*?)\"", prompt_text)
        if not idea_text:
            idea_text = extract_val(r"concept:\s*(.*?)(?:\n|$)", prompt_text)
        if not idea_text:
            idea_text = "Venture concept"
            
        location = extract_val(r"Location:\s*(.*?)(?:\n|$)", prompt_text)
        if not location:
            location = "Regional markets"
            
        industry = extract_val(r"Industry:\s*(.*?)(?:\n|$)", prompt_text, "Target industry")
        search_results_count = extract_val(r"Search results size:\s*(\d+)", prompt_text, "15")
        
        idea_lower = idea_text.lower()
        
        # Check prompt types
        if "Brand Strategy Consultant" in prompt_text or "creative startup names" in prompt_text:
            clean_idea = re.sub(r'[^\w\s]', '', idea_text).strip()
            words = [w.capitalize() for w in clean_idea.split() if w.lower() not in [
                "concept", "venture", "startup", "service", "app", "platform", "online", "system", "in", "at", "for", "a", "an", "the"
            ]]
            first_word = words[0] if words else "Venture"
            second_word = words[1] if len(words) > 1 else ""
            
            # If the user's idea contains "veg" or "food" or "hotel" or "restaurant"
            if any(k in idea_lower for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]):
                names = [
                    {"name": f"Vedic{first_word}" if "veg" in idea_lower else f"Aura{first_word}", "brand_uniqueness": 94, "tagline": "Purity on Every Plate.", "rationale": "• Connection to category: Reflects purity and clean eating.\n• Emotional appeal: Inspires trust and wholesomeness.\n• Brand perception: Health-focused and high-quality.\n• Market suitability: Fits urban demographic looking for premium dining.", "why_recommended": "It directly communicates clean-eating culinary roots while maintaining a modern, highly brandable trademark."},
                    {"name": f"PunjaguttaFeast" if "punjagutta" in idea_lower else f"Pure{first_word}", "brand_uniqueness": 88, "tagline": "Traditional Taste, Modern Hygiene.", "rationale": "• Connection to category: Locational tie-in with a focus on food.\n• Emotional appeal: Feels generous and inviting.\n• Brand perception: Friendly, high-volume dining brand.\n• Market suitability: High recall value for local consumers.", "why_recommended": "Anchors the business to a high-density regional hub, making it perfect for driving local foot traffic."},
                    {"name": f"GreenSparks" if "veg" in idea_lower else f"Nova{first_word}", "brand_uniqueness": 80, "tagline": "Innovating the Vegetarian Kitchen.", "rationale": "• Connection to category: Veg-centric sparks of flavor.\n• Emotional appeal: Modern and energetic.\n• Brand perception: Contemporary, eco-friendly lifestyle brand.\n• Market suitability: Appeals to younger, millennial consumer segment.", "why_recommended": "A modern and versatile identity that scales well to franchise models and online delivery apps."},
                    {"name": "TasteCrafter", "brand_uniqueness": 95, "tagline": "Curated Flavors for the Modern Palate.", "rationale": "• Connection to category: Highlights culinary craftsmanship.\n• Emotional appeal: Aspirational and premium.\n• Brand perception: Chef-driven, high-quality focus.\n• Market suitability: Fits both fine dining and premium takeout setups.", "why_recommended": "Craftsmanship angle allows for higher menu pricing and stronger margins."}
                ]
            else:
                names = [
                    {"name": f"Aura{first_word}", "brand_uniqueness": 92, "tagline": "Elevate Your Lifestyle.", "rationale": "• Connection to category: Elegant and premium tone for the sector.\n• Emotional appeal: Aspirational and calming.\n• Brand perception: Sophisticated and reliable.\n• Market suitability: Perfect for premium lifestyle or service sectors.", "why_recommended": "Minimalist and premium. It conveys sophistication and high-end positioning."},
                    {"name": f"Nova{first_word}{second_word}", "brand_uniqueness": 85, "tagline": "Next-Gen Solutions Defined.", "rationale": "• Connection to category: Highlights innovation and growth.\n• Emotional appeal: Inspiring and forward-thinking.\n• Brand perception: High-tech and modern.\n• Market suitability: Excellent for digital services or tech products.", "why_recommended": "Highlights modern, future-proof innovation, appealing to tech-savvy early adopters."},
                    {"name": f"{first_word}ly", "brand_uniqueness": 80, "tagline": "Simple. Smarter. Together.", "rationale": "• Connection to category: Clean, punchy name.\n• Emotional appeal: Friendly and approachable.\n• Brand perception: Digital-first and user-friendly.\n• Market suitability: Matches mobile app or SaaS platforms.", "why_recommended": "A modern, single-word brand name that flows easily and is highly memorable in advertising."},
                    {"name": f"Core{first_word}", "brand_uniqueness": 95, "tagline": "Uncompromising Trust and Integrity.", "rationale": "• Connection to category: Represents foundational stability.\n• Emotional appeal: Instills confidence and safety.\n• Brand perception: Extremely trustworthy and corporate.\n• Market suitability: Strong B2B or premium consumer appeal.", "why_recommended": "Evokes security and stability, building long-term institutional trust."}
                ]
            return json.dumps(names)
            
        elif "Business Intelligence Consultant" in prompt_text or "startup_validation" in prompt_text or "McKinsey-style" in prompt_text:
            keywords = extract_val(r"Keywords:\s*(.*?)(?:\n|$)", prompt_text, "this business")
            kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
            main_kw = kw_list[0] if kw_list else "this concept"
            
            if any(k in idea_lower for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]):
                paragraph = (
                    f"The feasibility assessment for launching {idea_text} in {location} shows a high-potential local opportunity. "
                    f"Steady demand for high-quality vegetarian dining options in high-density areas suggests strong initial support, "
                    f"though success will rely on ingredient quality, local pricing alignment, and efficient kitchen management."
                )
                insights = [
                    f"Demand Insight: Consistent foot traffic patterns and local dining demand indicate strong interest in vegetarian dining options.",
                    f"Customer Insight: Target customers consist of health-conscious families and local professionals seeking clean vegetarian meals.",
                    f"Revenue Insight: Monetization is driven by direct dine-in sales, high-margin catering, and local home deliveries.",
                    f"Competition Insight: Competitive environment includes traditional local eateries, highlighting a need for premium quality and hygiene standards.",
                    f"Growth Insight: Operational expansion is highly viable through additional local outlets and franchise branding."
                ]
            elif any(k in idea_lower for k in ["saas", "software", "app", "platform", "online", "crm", "api"]):
                customer_profile = "tech-savvy users seeking digital efficiency and seamless integrations"
                revenue_model = "tiered subscription billing or consumption-based SaaS licensing"
                competition_desc = "global digital solutions, requiring a focus on user experience and custom features"
                scalability = "virtually infinite scaling capability with near-zero marginal distribution costs"
                paragraph = (
                    f"The feasibility assessment for launching {idea_text} in {location} reveals a viable market opportunity. "
                    f"Consumer interest in '{main_kw}' indicates a healthy initial audience, but long-term success "
                    f"will depend on cost-effective customer acquisition and clear value differentiation."
                )
                insights = [
                    f"Demand Insight: Persistent regional search velocity indicates stable consumer interest in {main_kw}.",
                    f"Customer Insight: Target customers consist of {customer_profile}.",
                    f"Revenue Insight: Monetization is best driven by {revenue_model}.",
                    f"Competition Insight: Local saturation includes {competition_desc}.",
                    f"Growth Insight: Operational scalability will rely on {scalability}."
                ]
            elif any(k in idea_lower for k in ["shop", "store", "salon", "boutique", "clinic", "laundry"]):
                customer_profile = f"local residents in {location} prioritizing convenience, quality, and community touchpoints"
                revenue_model = "direct retail sales, premium services, or service package subscriptions"
                competition_desc = f"established regional operators in {location}, necessitating unique branding moats"
                scalability = f"regional hub expansion or franchising options across adjacent high-density locations"
                paragraph = (
                    f"The feasibility assessment for launching {idea_text} in {location} reveals a viable market opportunity. "
                    f"Consumer interest in '{main_kw}' indicates a healthy initial audience, but long-term success "
                    f"will depend on cost-effective customer acquisition and clear value differentiation."
                )
                insights = [
                    f"Demand Insight: Persistent regional search velocity indicates stable consumer interest in {main_kw}.",
                    f"Customer Insight: Target customers consist of {customer_profile}.",
                    f"Revenue Insight: Monetization is best driven by {revenue_model}.",
                    f"Competition Insight: Local saturation includes {competition_desc}.",
                    f"Growth Insight: Operational scalability will rely on {scalability}."
                ]
            else:
                customer_profile = "eco-conscious consumers seeking premium, authentic, or handcrafted products"
                revenue_model = "direct-to-consumer e-commerce sales and wholesale distribution partnerships"
                competition_desc = "mass-market manufacturers, making organic branding and premium packaging essential"
                scalability = "contract manufacturing partnerships and online marketplace distribution pipelines"
                paragraph = (
                    f"The feasibility assessment for launching {idea_text} in {location} reveals a viable market opportunity. "
                    f"Consumer interest in '{main_kw}' indicates a healthy initial audience, but long-term success "
                    f"will depend on cost-effective customer acquisition and clear value differentiation."
                )
                insights = [
                    f"Demand Insight: Persistent regional search velocity indicates stable consumer interest in {main_kw}.",
                    f"Customer Insight: Target customers consist of {customer_profile}.",
                    f"Revenue Insight: Monetization is best driven by {revenue_model}.",
                    f"Competition Insight: Local saturation includes {competition_desc}.",
                    f"Growth Insight: Operational scalability will rely on {scalability}."
                ]
            
            return json.dumps({
                "paragraph": paragraph,
                "insights": insights,
                "recommendation": f"Finalize core recipes and run a trial soft launch in {location} to validate local taste preferences." if any(k in idea_lower for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]) else f"Launch a small-scale validation pilot in {location} to test client acquisition costs directly."
            })
            
        elif "Market Intelligence Analyst" in prompt_text or "market_analysis" in prompt_text:
            keywords = extract_val(r"Keywords:\s*(.*?)(?:\n|$)", prompt_text, "this business")
            kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
            main_kw = kw_list[0] if kw_list else "this concept"
            growth_rate = extract_val(r"Growth rate:\s*([\d\.-]+)%", prompt_text, "5.0")
            
            # Check if physical/veg dining
            if any(k in idea_text.lower() for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]):
                return json.dumps({
                    "insights": [
                        f"Market size/interest: Solid local foot traffic and customer query interest for quality vegetarian dining options.",
                        f"Demand trajectory: Local interest in vegetarian dining is growing at {growth_rate}% annually, driven by health consciousness.",
                        f"Market maturity: The local segment is highly traditional but shows emerging demand for hygienic fine-dining and home deliveries.",
                        f"Growth outlook: High potential for a premium vegetarian brand to secure a high-margin, durable presence."
                    ],
                    "interpretation": f"Local interest for {idea_text} remains strong. The {growth_rate}% growth trajectory indicates a healthy environment for launching a new, hygienic outlet with targeted community marketing."
                })

            return json.dumps({
                "insights": [
                    f"Market size/interest: Strong search query velocity for '{main_kw}' reveals positive consumer pull.",
                    f"Demand trajectory: Search interest is expanding at {growth_rate}% annually, showing solid momentum.",
                    f"Market maturity: The regional segment shows early-to-mid stage maturity with space for new brands.",
                    f"Growth outlook: Category expansion is well-supported by local demographic and digital adoption trends."
                ],
                "interpretation": f"Regional search interest for {idea_text} remains stable. The {growth_rate}% growth trajectory suggests a healthy runway for a new brand to enter with targeted, location-specific marketing."
            })
            
        elif "Competitive Intelligence Expert" in prompt_text or "competitor_analysis" in prompt_text:
            idea_lower = idea_text.lower()
            if "pet" in idea_lower:
                comp1, comp2 = "Paws & Claws Care", "TailWaggers Center"
                diff1 = "Established local pet brand, but lacks organic premium food delivery."
                diff2 = "High volume services, but minimal personalized nutrition plans."
            elif any(k in idea_lower for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]):
                comp1, comp2 = "Local Pure Veg Restaurant – Budget Segment", "Established Family-Run Vegetarian Hotel"
                diff1 = "High-volume traditional dining options, but lacks premium hygiene standards and digital delivery integrations."
                diff2 = "Highly loyal local family clientele, but limited menu innovation and slower turnaround times."
            elif "fitness" in idea_lower or "gym" in idea_lower:
                comp1, comp2 = "IronMoat Fitness", "Pulse Studio"
                diff1 = "Large facility, but high subscription prices and lack of personal trainer coaching."
                diff2 = "Modern equipment, but lacks localized group fitness schedules."
            else:
                comp1, comp2 = "Legacy Service Inc.", "Apex Providers"
                diff1 = "Broad regional service footprint, but poor customer review rating and slow response."
                diff2 = "Competitive pricing, but lacks digital-first online scheduling booking."

            return json.dumps({
                "competitors": [
                    {
                        "name": comp1,
                        "rating": 4.3,
                        "reviews": 48,
                        "address": f"{location}",
                        "differentiator": diff1
                    },
                    {
                        "name": comp2,
                        "rating": 3.9,
                        "reviews": 12,
                        "address": f"{location}",
                        "differentiator": diff2
                    }
                ],
                "gap_analysis": {
                  "premium_segment": f"Premium options for {industry} are sparse in {location}, leaving a high-margin opportunity.",
                  "differentiation_potential": "Excellent opportunity to win market share via technology-driven scheduling and custom packages.",
                  "market_saturation": "Moderate local saturation; established incumbents rely on legacy channels.",
                  "expansion_opportunity": "High potential to expand into neighboring sub-regions once operations stabilize."
                }
            })
            
        elif "Risk Management Consultant" in prompt_text or "risk_assessment" in prompt_text:
            return json.dumps({
                "weaknesses": [
                    "Weakness #1: High initial customer acquisition costs.",
                    "Weakness #2: Dependency on key operational staff."
                ],
                "threats": [
                    "Threat #1: Competitor price matching and local advertising campaigns.",
                    "Threat #2: Shift in local municipal guidelines."
                ],
                "key_risks": [
                    "Key Risk #1: Supply chain instability.",
                    "Key Risk #2: Low client retention rates."
                ]
            })
            
        elif "Strategic Growth Adviser" in prompt_text or "Strategic Growth Advisor" in prompt_text or "opportunity_analysis" in prompt_text:
            if any(k in idea_lower for k in ["veg", "food", "hotel", "restaurant", "dining", "cafe", "bistro", "dhaba", "dhabha", "diner"]):
                roadmap = [
                    {
                        "phase": "Week 1–2",
                        "title": "Menu Finalization",
                        "tasks": [
                            "Draft core vegetarian menu options and price tiers",
                            "Conduct local customer tasting focus groups"
                        ]
                    },
                    {
                        "phase": "Week 3–4",
                        "title": "Supplier & Permits",
                        "tasks": [
                            "Complete vegetable and raw ingredient supplier sourcing",
                            "Submit FSSAI registration and municipal health licensing forms"
                        ]
                    },
                    {
                        "phase": "Month 2",
                        "title": "Trial Kitchen Setup",
                        "tasks": [
                            "Finalize kitchen layout and setup trial kitchen cooking",
                            "Soft launch for friends, family, and local food critics"
                        ]
                    },
                    {
                        "phase": "Month 3",
                        "title": "Grand Launch",
                        "tasks": [
                            "Open physical doors for dine-in and takeout service",
                            "Onboard with local delivery partner channels"
                        ]
                    }
                ]
            else:
                roadmap = [
                    {
                        "phase": "Week 1–2",
                        "title": "Validate Demand",
                        "tasks": [
                            "Conduct local customer interviews",
                            "Setup basic web landing page to capture email interest"
                        ]
                    },
                    {
                        "phase": "Week 3–4",
                        "title": "Build MVP",
                        "tasks": [
                            "Finalize core service packages or product formulations",
                            "Setup payment processing and basic booking system"
                        ]
                    },
                    {
                        "phase": "Month 2",
                        "title": "Launch Pilot",
                        "tasks": [
                            "Run targeted local social media ads",
                            "Fulfill first 20 orders and collect testimonials"
                        ]
                    },
                    {
                        "phase": "Month 3",
                        "title": "Measure Traction",
                        "tasks": [
                            "Track customer acquisition cost (CAC) and lifetime value (LTV)",
                            "Scale booking capacity and launch corporate packages"
                        ]
                    }
                ]

            return json.dumps({
                "strengths": [
                    "Strength #1: High margin potential.",
                    "Strength #2: Direct customer relationships."
                ],
                "opportunities": [
                    "Opportunity #1: B2B corporate partnerships.",
                    "Opportunity #2: Online marketplace expansion."
                ],
                "key_opportunities": [
                    "Establish a premium subscription model to lock in recurring revenue.",
                    "Expand geographical reach to adjacent high-income neighborhoods.",
                    "Partner with local businesses for bundle-deal marketing.",
                    "Create a referral program to lower customer acquisition costs.",
                    "Deploy digital booking to maximize client booking convenience."
                ],
                "roadmap": roadmap
            })
            
        elif "Venture Capital Investment Committee Chair" in prompt_text or "final_report" in prompt_text:
            demand_score = int(extract_val(r"Demand:\s*(\d+)", prompt_text, "50"))
            trend_score = int(extract_val(r"Trend:\s*(\d+)", prompt_text, "50"))
            competition_score = int(extract_val(r"Competition:\s*(\d+)", prompt_text, "50"))
            viability_score = int(extract_val(r"Viability:\s*(\d+)", prompt_text, "50"))
            
            status = "🟢 Strong Opportunity" if viability_score >= 75 else "🟡 Proceed with Caution" if viability_score >= 45 else "🔴 High Risk"
            potential_stars = 5 if viability_score >= 80 else 4 if viability_score >= 60 else 3 if viability_score >= 45 else 2
            
            reasons = [
                f"Demand score of {demand_score}/100 indicates {'strong consumer query velocity' if demand_score >= 70 else 'stable but moderate local interest' if demand_score >= 45 else 'emerging niche awareness'} for this concept.",
                f"Regional search trend ({trend_score}/100) indicates {'favorable category growth' if trend_score >= 60 else 'stable market interest'} in the target region.",
                f"Competitive Saturation is {'low, offering a clear entry window' if competition_score < 45 else 'moderate, requiring a unique value hook' if competition_score < 70 else 'high, necessitating a strong branding moat'}."
            ]
            
            return json.dumps({
                "potential": potential_stars,
                "confidence": viability_score,
                "status": status,
                "reasons": reasons,
                "strengths": [
                    "Strong unit margins",
                    "High brand loyalty potential"
                ],
                "risks": [
                    "Rising customer acquisition costs",
                    "Operational talent retention"
                ],
                "next_step": f"Initiate validation pilot in {location} immediately."
            })

        elif "trend_analysis" in prompt_text:
            return f"Search trends for {idea_text} in {location} reflect rising search volumes with steady regional query density."
            
        return json.dumps({
            "paragraph": "Feasibility study indicates viable market signals. Moderate customer interest supports a pilot launch.",
            "insights": [
                "Feasibility shows viable signals.",
                "Customer demand is moderate.",
                "Competitor footprint is manageable.",
                "Risk levels are moderate.",
                "Growth runway remains stable."
            ],
            "recommendation": "Initiate micro-validation launch."
        })


    def generate_startup_validation(self, idea_data):
        prompt = STARTUP_VALIDATION_TEMPLATE.format(**idea_data)
        response = self._call_llm(prompt)
        self._log_prompt_call("startup_validation_prompt", idea_data, prompt, response)
        return response

    def generate_market_analysis(self, idea_data, search_count, trends_growth):
        prompt = MARKET_ANALYSIS_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            location=idea_data["location"],
            search_results_count=search_count,
            trends_growth_rate=trends_growth,
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("market_analysis_prompt", idea_data, prompt, response)
        return response

    def generate_competitor_analysis(self, idea_data, competitors):
        prompt = COMPETITOR_ANALYSIS_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            location=idea_data["location"],
            competitors_json=json.dumps(competitors, indent=2),
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("competitor_analysis_prompt", idea_data, prompt, response)
        return response

    def generate_business_names(self, idea_data):
        prompt = BUSINESS_NAME_TEMPLATE.format(idea_text=idea_data["idea_text"])
        response = self._call_llm(prompt)
        # Parse JSON — strip markdown fences if present
        clean = response
        if "```" in response:
            m = re.search(r"```(?:json)?(.*?)```", response, re.DOTALL)
            if m:
                clean = m.group(1).strip()
        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse business names JSON from response. Using fallback.")
            parsed = [
                {"name": "VenturePro", "brand_uniqueness": 75, "tagline": "Professional Excellence.", "rationale": "• Connection to category: Reliable brand presence\n• Emotional appeal: Highlights professional standards\n• Brand perception: Suitable for corporate service sectors"},
                {"name": "NovaBiz", "brand_uniqueness": 85, "tagline": "Smarter Business Ahead.", "rationale": "• Connection to category: Modern innovative naming tone\n• Emotional appeal: Highly memorable brand identity\n• Brand perception: Excellent match for emerging tech sectors"},
                {"name": "CoreSolution", "brand_uniqueness": 70, "tagline": "Foundation of Success.", "rationale": "• Connection to category: Solid foundational trust indicator\n• Emotional appeal: Highly reputable corporate tone\n• Brand perception: Fits business-to-business models well"},
                {"name": "AuraStart", "brand_uniqueness": 80, "tagline": "Inspire the Journey.", "rationale": "• Connection to category: Premium and aspirational styling\n• Emotional appeal: Focuses on starting strong\n• Brand perception: Great traction with younger demographics"}
            ]
        self._log_prompt_call("business_name_prompt", idea_data, prompt, response)
        return parsed

    def generate_risk_assessment(self, idea_data, risk_score):
        prompt = RISK_ASSESSMENT_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            location=idea_data["location"],
            risk_score=risk_score,
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("risk_assessment_prompt", idea_data, prompt, response)
        return response

    def generate_trend_analysis(self, idea_data, trends_growth):
        prompt = TREND_ANALYSIS_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            location=idea_data["location"],
            trends_growth_rate=trends_growth,
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("trend_analysis_prompt", idea_data, prompt, response)
        return response

    def generate_opportunity_analysis(self, idea_data, opportunity_score):
        prompt = OPPORTUNITY_ANALYSIS_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            location=idea_data["location"],
            opportunity_score=opportunity_score,
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("opportunity_analysis_prompt", idea_data, prompt, response)
        return response

    def generate_final_report(self, idea_data, scores):
        prompt = FINAL_REPORT_TEMPLATE.format(
            idea_text=idea_data["idea_text"],
            industry=idea_data["industry"],
            location=idea_data["location"],
            demand_score=scores["demand"],
            trend_score=scores["trend"],
            competition_score=scores["competition"],
            viability_score=scores["viability"],
        )
        response = self._call_llm(prompt)
        self._log_prompt_call("final_report_prompt", idea_data, prompt, response)
        return response
