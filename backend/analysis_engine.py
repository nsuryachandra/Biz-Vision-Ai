import logging

logger = logging.getLogger(__name__)

class AnalysisEngine:
    def calculate_scores(self, search_data, trends_data, news_data, maps_data):
        """
        Calculate metrics and compute scores using the required business logic.
        Range of all scores is 0-100.
        """
        # 1. Competitor / Maps metrics
        competitors = maps_data.get("local_results", [])
        competitor_count = len(competitors)
        
        if competitor_count > 0:
            avg_rating = sum([c.get("rating", 4.0) for c in competitors]) / competitor_count
            avg_reviews = sum([c.get("reviews", 10) for c in competitors]) / competitor_count
            # High ratings and review counts increase competitor strength
            competition_score = min(100, max(10, round((avg_rating * 15) + (min(avg_reviews, 150) * 0.15))))
            # Saturation increases with number of competitors
            market_saturation = min(100, competitor_count * 22)
        else:
            competition_score = 15 # Low base competition
            market_saturation = 5

        # 2. Sentiment analysis from Google News
        news_articles = news_data.get("news_results", [])
        positive_count = 0
        negative_count = 0
        
        # Simple sentiment keywords fallback
        positive_keywords = {"grow", "surge", "boom", "success", "innovate", "rise", "positive", "skyrocket", "gain"}
        negative_keywords = {"risk", "fail", "decline", "regulation", "cautious", "drop", "warn", "loss", "bankrupt"}
        
        for article in news_articles:
            # Check for SerpAPI mock sentiment hint or parse text
            hint = article.get("sentiment_hint")
            if hint == "positive":
                positive_count += 1
            elif hint == "negative":
                negative_count += 1
            else:
                title_lower = article.get("title", "").lower()
                pos_hits = sum([1 for w in positive_keywords if w in title_lower])
                neg_hits = sum([1 for w in negative_keywords if w in title_lower])
                if pos_hits > neg_hits:
                    positive_count += 1
                elif neg_hits > pos_hits:
                    negative_count += 1
                else:
                    positive_count += 1 # Default neutral counts positive for base optimism
        
        total_news = len(news_articles)
        if total_news > 0:
            sentiment_score = round((positive_count / total_news) * 100)
            negative_sentiment = 100 - sentiment_score
        else:
            sentiment_score = 75 # Default neutral-positive
            negative_sentiment = 25

        # 3. Demand score from Search results count
        total_results = search_data.get("search_information", {}).get("total_results", 100000)
        # Logarithmic-like scaling for search results (bounded 0 to 100)
        # 10,000 results -> ~30 demand, 1,000,000 results -> ~85 demand
        if total_results > 0:
            import math
            demand_score = min(100, max(10, round(math.log10(total_results) * 12 + 10)))
        else:
            demand_score = 40

        # 4. Trend score from Trends growth rate
        growth_rate = trends_data.get("growth_rate", 10.0)
        # Centered around 60 score. Positive growth rate pushes it higher, negative pulls it down
        trend_score = min(100, max(5, round(60 + (growth_rate * 0.8))))
        weak_trend_growth = 100 - trend_score

        # --- Formula Computations ---
        
        # Risk Score = (Competition × 0.40) + (Negative Sentiment × 0.25) + (Market Saturation × 0.20) + (Weak Trend Growth × 0.15)
        raw_risk = (
            (competition_score * 0.40) +
            (negative_sentiment * 0.25) +
            (market_saturation * 0.20) +
            (weak_trend_growth * 0.15)
        )
        risk_score = min(100, max(0, round(raw_risk)))

        # Opportunity Score = (Demand × 0.35) + (Trend Growth × 0.30) + (Positive Sentiment × 0.20) + (Low Competition × 0.15)
        low_competition = 100 - competition_score
        raw_opportunity = (
            (demand_score * 0.35) +
            (trend_score * 0.30) +
            (sentiment_score * 0.20) +
            (low_competition * 0.15)
        )
        opportunity_score = min(100, max(0, round(raw_opportunity)))

        # Viability Score = (Demand × 0.30) + (Opportunity × 0.30) + (Trend × 0.20) + (Sentiment × 0.20)
        raw_viability = (
            (demand_score * 0.30) +
            (opportunity_score * 0.30) +
            (trend_score * 0.20) +
            (sentiment_score * 0.20)
        )
        viability_score = min(100, max(0, round(raw_viability)))

        return {
            "demand": demand_score,
            "trend": trend_score,
            "competition": competition_score,
            "sentiment": sentiment_score,
            "opportunity": opportunity_score,
            "risk": risk_score,
            "viability": viability_score
        }
