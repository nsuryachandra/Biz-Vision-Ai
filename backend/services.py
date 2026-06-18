import requests
import json
import logging
from config import Config
from db import execute_query

logger = logging.getLogger(__name__)


class SerpAPIService:
    """Wrapper around the SerpAPI search engine API.

    Every public method catches ALL exceptions and returns a safe empty
    dictionary so that a missing result from any single search source
    never crashes the /analyze pipeline.
    """

    def __init__(self):
        self.api_key  = Config.SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"
        if not self.api_key:
            raise ValueError(
                "SERPAPI_KEY is not configured. "
                "Add SERPAPI_KEY=<your_key> to the .env file — get a free key at serpapi.com"
            )

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _log(self, api_name, endpoint, status_code, data):
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

    def _get(self, params, api_name):
        """Low-level GET request to SerpAPI.

        Raises ValueError when the response contains an error body (e.g. 'no results').
        Raises ConnectionError on network failures.
        """
        params["api_key"] = self.api_key
        try:
            resp = requests.get(self.base_url, params=params, timeout=15)
            status = resp.status_code
            data   = resp.json() if status == 200 else {"error": resp.text}
            self._log(api_name, str(params.get("q", "")), status, data)
            if status != 200:
                raise ValueError(f"{api_name} HTTP {status}: {data.get('error', 'unknown')}")
            if "error" in data:
                raise ValueError(f"{api_name} error: {data['error']}")
            return data
        except requests.exceptions.RequestException as exc:
            raise ConnectionError(f"{api_name} network error: {exc}") from exc

    # ── Public methods (each has its own safety net) ──────────────────────────

    def fetch_google_search(self, keywords: str, location: str) -> dict:
        """Web search demand signal. Falls back to neutral defaults on any error."""
        query = f"{keywords} {location} business market"
        try:
            return self._get({"engine": "google", "q": query}, "Google Search")
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Search failed ({exc}). Returning default demand signal.")
            return {"search_information": {"total_results": 150_000}}

    def fetch_google_trends(self, keywords: str) -> dict:
        """12-month interest timeline. Falls back to empty timeline on any error."""
        topic = keywords.split(",")[0].strip()
        try:
            return self._get(
                {"engine": "google_trends", "q": topic, "date": "today 12-m"},
                "Google Trends",
            )
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Trends failed ({exc}). Returning empty timeline.")
            return {"interest_over_time": {"timeline_data": []}, "growth_rate": 0.0}

    def fetch_google_news(self, keywords: str, industry: str) -> dict:
        """News sentiment feed. Falls back to empty article list on any error."""
        query = f"{keywords} {industry} market trends"
        try:
            return self._get({"engine": "google", "tbm": "nws", "q": query}, "Google News")
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google News failed ({exc}). Returning empty news feed.")
            return {"news_results": []}

    def fetch_google_maps(self, keywords: str, location: str) -> dict:
        """Local competitor discovery. Falls back to empty list on any error."""
        query = f"{keywords} near {location}"
        try:
            return self._get({"engine": "google_maps", "q": query}, "Google Maps")
        except Exception as exc:
            logger.warning(f"[SerpAPI] Google Maps failed ({exc}). Returning empty competitor list.")
            return {"local_results": []}
