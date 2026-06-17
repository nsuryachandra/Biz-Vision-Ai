import requests
import json
import logging
from config import Config
from db import execute_query

logger = logging.getLogger(__name__)


class SerpAPIService:
    def __init__(self):
        self.api_key = Config.SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"
        if not self.api_key:
            raise ValueError(
                "SerpAPI key is not configured. "
                "Add SERPAPI_KEY=<your_key> to the .env file. "
                "Get a free key at https://serpapi.com"
            )

    def _log_api_call(self, api_name, endpoint, status_code, response_data):
        """Record the API call in the api_logs table."""
        try:
            summary = {
                "success": status_code == 200,
                "data_keys": list(response_data.keys()) if isinstance(response_data, dict) else [],
            }
            if not summary["success"]:
                summary["error"] = str(response_data)
            execute_query(
                "INSERT INTO api_logs (api_name, endpoint, status_code, response_summary) VALUES (%s, %s, %s, %s)",
                (api_name, endpoint, status_code, json.dumps(summary)),
                commit=True,
            )
        except Exception as e:
            logger.error(f"Failed to log API call: {e}")

    def _get(self, params, api_name):
        """Shared SerpAPI GET helper. Raises ValueError on API error response."""
        params["api_key"] = self.api_key
        try:
            response = requests.get(self.base_url, params=params, timeout=15)
            status_code = response.status_code
            data = response.json() if status_code == 200 else {"error": response.text}
            self._log_api_call(api_name, str(params.get("q", "")), status_code, data)
            if status_code != 200:
                raise ValueError(f"{api_name} failed (HTTP {status_code}): {data.get('error', 'unknown error')}")
            if "error" in data:
                raise ValueError(f"{api_name} error: {data['error']}")
            return data
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"{api_name} network error: {e}")

    def fetch_google_search(self, keywords, location):
        """Perform a live web search for the startup concept."""
        query = f"{keywords} {location} business market"
        return self._get({"engine": "google", "q": query}, "Google Search")

    def fetch_google_trends(self, keywords):
        """Fetch live interest timeline over the past 12 months."""
        topic = keywords.split(",")[0].strip()
        return self._get(
            {"engine": "google_trends", "q": topic, "date": "today 12-m"},
            "Google Trends",
        )

    def fetch_google_news(self, keywords, industry):
        """Fetch live news articles for sentiment analysis."""
        query = f"{keywords} {industry} market trends"
        return self._get({"engine": "google", "tbm": "nws", "q": query}, "Google News")

    def fetch_google_maps(self, keywords, location):
        """Locate live local competitors and collect reviews/ratings."""
        query = f"{keywords} near {location}"
        return self._get({"engine": "google_maps", "q": query}, "Google Maps")
