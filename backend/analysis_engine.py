import math
import logging

logger = logging.getLogger(__name__)


class AnalysisEngine:
    """Converts raw SerpAPI payloads into normalised 0-100 business scores.

    All arithmetic is guarded against ZeroDivisionError and missing keys so
    the engine always returns a valid score dict, even when every upstream
    data source is empty.
    """

    def calculate_scores(
        self,
        search_data: dict,
        trends_data: dict,
        news_data:   dict,
        maps_data:   dict,
    ) -> dict:

        # ── 1. Competition (Google Maps) ──────────────────────────────────────
        competitors    = maps_data.get("local_results", [])
        comp_count     = len(competitors)

        if comp_count > 0:
            avg_rating  = sum(float(c.get("rating") or 4.0) for c in competitors) / comp_count
            avg_reviews = sum(float(c.get("reviews") or 10)  for c in competitors) / comp_count
            competition_score = min(100, max(10, round(avg_rating * 15 + min(avg_reviews, 150) * 0.15)))
            market_saturation = min(100, comp_count * 22)
        else:
            competition_score = 15
            market_saturation = 5

        # ── 2. Sentiment (Google News) ────────────────────────────────────────
        POS_WORDS = {"grow", "surge", "boom", "success", "innovate", "rise",
                     "positive", "skyrocket", "gain", "opportunity", "launch"}
        NEG_WORDS = {"risk", "fail", "decline", "regulation", "cautious",
                     "drop", "warn", "loss", "bankrupt", "lawsuit", "shutdown"}

        articles  = news_data.get("news_results", [])
        pos, neg  = 0, 0
        for art in articles:
            hint = art.get("sentiment_hint")
            if hint == "positive":
                pos += 1
            elif hint == "negative":
                neg += 1
            else:
                title = (art.get("title") or "").lower()
                p = sum(1 for w in POS_WORDS if w in title)
                n = sum(1 for w in NEG_WORDS if w in title)
                if p > n:
                    pos += 1
                elif n > p:
                    neg += 1
                else:
                    pass  # neutral: do not increment pos or neg

        total_news = len(articles)
        if total_news > 0:
            sentiment_score    = round((pos / total_news) * 100)
            negative_sentiment = 100 - sentiment_score
        else:
            sentiment_score    = 50
            negative_sentiment = 50

        # ── 3. Demand (Google Search) ─────────────────────────────────────────
        total_results = search_data.get("search_information", {}).get("total_results", 0)
        if isinstance(total_results, str):
            # SerpAPI sometimes returns "About 1,230,000 results" as a string
            total_results = int("".join(filter(str.isdigit, total_results)) or "0")
        if total_results and total_results > 0:
            demand_score = min(100, max(10, round(math.log10(max(total_results, 1)) * 12 + 10)))
        else:
            demand_score = 15

        # ── 4. Trend Score (Google Trends) ────────────────────────────────────
        growth_rate  = float(trends_data.get("growth_rate") or 0.0)
        trend_score  = min(100, max(5, round(60 + growth_rate * 0.8)))
        weak_trend   = 100 - trend_score

        # ── Composite formulae ────────────────────────────────────────────────
        risk_score = min(100, max(0, round(
            competition_score  * 0.40
            + negative_sentiment * 0.25
            + market_saturation  * 0.20
            + weak_trend         * 0.15
        )))

        low_competition  = 100 - competition_score
        opportunity_score = min(100, max(0, round(
            demand_score     * 0.35
            + trend_score    * 0.30
            + sentiment_score * 0.20
            + low_competition * 0.15
        )))

        viability_score = min(100, max(0, round(
            demand_score      * 0.30
            + opportunity_score * 0.30
            + trend_score       * 0.20
            + sentiment_score   * 0.20
        )))

        return {
            "demand":      demand_score,
            "trend":       trend_score,
            "competition": competition_score,
            "sentiment":   sentiment_score,
            "opportunity": opportunity_score,
            "risk":        risk_score,
            "viability":   viability_score,
        }
