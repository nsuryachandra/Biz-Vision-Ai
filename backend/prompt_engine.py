import re
import logging
import json
import google.generativeai as genai
from config import Config
from db import execute_query

logger = logging.getLogger(__name__)

# ─── Prompt Templates ────────────────────────────────────────────────────────

STARTUP_VALIDATION_TEMPLATE = """
System: You are an Elite Startup Consultant and Venture Partner. Analyze this startup idea.
Idea: {idea_text}
Keywords: {keywords}
Location: {location}
Industry: {industry}
Business Type: {business_type}

Provide a professional, critical evaluation of this opportunity. Answer:
1. Is there a genuine market need?
2. What are the key drivers for growth in this sector?
3. What is the target customer demographic?
Write exactly two professional paragraphs in a McKinsey consulting style.
"""

MARKET_ANALYSIS_TEMPLATE = """
System: You are a Market Intelligence Analyst. Analyze the market demand and trends.
Idea: {idea_text}
Location: {location}
Search results size: {search_results_count}
Google Trends growth rate: {trends_growth_rate}%

Provide a formal market demand and trend analysis.
Evaluate the search volume, geographical relevance, and whether this trend is long-term or short-term.
Write exactly two analytical paragraphs in a Deloitte-style format.
"""

COMPETITOR_ANALYSIS_TEMPLATE = """
System: You are a Competitive Intelligence Expert. Analyze local competitors.
Idea: {idea_text}
Location: {location}
Competitor List: {competitors_json}

Provide a competitor intelligence report.
Assess the level of market saturation, rating distribution, and what unique value proposition (UVP) this new startup should adopt to win against these competitors.
Write exactly two analytical paragraphs in a BCG-style format.
"""

BUSINESS_NAME_TEMPLATE = """
System: You are a Brand Strategy Consultant and Naming Expert.
Generate exactly 4 highly creative startup names for the following concept: "{idea_text}".
Return a JSON array of objects. Each object MUST have these keys:
- "name": Generated name
- "popularity": "High" / "Medium" / "Low"
- "competition": "High" / "Medium" / "Low"
- "brand_uniqueness": 0-100 score
- "rationale": 1-sentence brand reasoning

Ensure names are catchy and modern (like Stripe, Vercel, Linear). Return ONLY raw valid JSON, nothing else.
"""

RISK_ASSESSMENT_TEMPLATE = """
System: You are a Risk Management Consultant and Startup Failure Specialist.
Idea: {idea_text}
Location: {location}
Calculated Risk Score (0-100): {risk_score}

Assess the risks facing this startup:
1. Operational & Regulatory barriers.
2. Market entry & competition risks.
3. Mitigation strategies.
Write exactly two analytical paragraphs in a PwC-style format.
"""

FINAL_REPORT_TEMPLATE = """
System: You are a Venture Capital Investment Committee Chair.
Idea: {idea_text}
Industry: {industry}
Location: {location}
Scores:
- Demand Score: {demand_score}/100
- Trend Score: {trend_score}/100
- Competition Score: {competition_score}/100
- Viability Score: {viability_score}/100

Synthesize a final executive summary and strategic recommendation.
Is this business viable to fund? Under what conditions? What are the next 3 immediate execution steps?
Write exactly two paragraphs: a high-level Executive Summary and a Final Strategic Verdict.
"""


class PromptEngine:
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError(
                "Gemini API key is not configured. "
                "Add GEMINI_API_KEY=<your_key> to the .env file. "
                "Get a free key at https://aistudio.google.com"
            )
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

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
        """Invoke Gemini. Raises on failure — no silent fallbacks."""
        response = self.model.generate_content(prompt_text)
        return response.text.strip()

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
        parsed = json.loads(clean)
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
