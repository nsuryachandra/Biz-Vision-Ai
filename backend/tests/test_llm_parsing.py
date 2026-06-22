import sys
# Python 3.14 compatibility hotfix for Google Protobuf / UPB extensions
sys.modules['google._upb'] = None
sys.modules['google._upb._message'] = None

import os
import logging
import json

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("test_llm_parsing")

from market_intelligence_service import MarketIntelligenceService
from db import execute_query, check_db_health

def run_tests():
    logger.info("Starting V2 AI classification and persistence tests...")
    
    # 1. Check database health
    if not check_db_health():
        logger.error("Database health check failed! Cannot run test.")
        sys.exit(1)
    logger.info("Database health check passed. Connected to Aiven MySQL.")
    
    # 2. Instantiate Service
    service = MarketIntelligenceService()
    
    # 3. Test Ideas
    test_ideas = [
        {
            "text": "I want to start a vegan sourdough bakery and cafe in Austin, TX",
            "expected_loc": "Austin, TX",
            "expected_industry": "Food & Beverage",
            "expected_type": "Food Service / Restaurant"
        },
        {
            "text": "An AI-powered automated video editing platform for content creators in Seattle, WA",
            "expected_loc": "Seattle, WA",
            "expected_industry": "Technology & SaaS",
            "expected_type": "SaaS / Software Product"
        }
    ]
    
    for i, idea_info in enumerate(test_ideas, 1):
        logger.info(f"\n--- Testing Idea {i}: '{idea_info['text']}' ---")
        
        # Parse idea via LLM
        parsed = service.parse_idea_via_llm(idea_info["text"], location=idea_info["expected_loc"])
        logger.info(f"Parsed Result:\n{json.dumps(parsed, indent=2)}")
        
        # Basic validation of parsed result structures
        assert "idea_text" in parsed, "Missing 'idea_text' in parsed response"
        assert "keywords" in parsed, "Missing 'keywords' in parsed response"
        assert "location" in parsed, "Missing 'location' in parsed response"
        assert "industry" in parsed, "Missing 'industry' in parsed response"
        assert "business_type" in parsed, "Missing 'business_type' in parsed response"
        assert "sub_category" in parsed, "Missing 'sub_category' in parsed response"
        
        logger.info("LLM parsing structure validated successfully.")
        
        # Test Database Insertion
        logger.info("Attempting to insert parsed idea into database...")
        idea_id = execute_query(
            """INSERT INTO business_ideas
               (user_id, idea_text, keywords, location, industry, business_type)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                None,  # user_id
                parsed["idea_text"],
                parsed["keywords"],
                parsed["location"],
                parsed["industry"],
                parsed["business_type"]
            ),
            commit=True
        )
        logger.info(f"Database insertion successful. Created idea_id: {idea_id}")
        
        # Verify persistence by reading it back
        persisted = execute_query(
            "SELECT * FROM business_ideas WHERE id = %s",
            (idea_id,),
            fetch="one"
        )
        logger.info(f"Persisted record read back: {persisted}")
        
        # Check values
        assert persisted["idea_text"] == parsed["idea_text"]
        assert persisted["keywords"] == parsed["keywords"]
        assert persisted["location"] == parsed["location"]
        assert persisted["industry"] == parsed["industry"]
        assert persisted["business_type"] == parsed["business_type"]
        
        logger.info(f"Idea {i} database validation checks PASSED.")
        
        # Cleanup test record
        execute_query("DELETE FROM business_ideas WHERE id = %s", (idea_id,), commit=True)
        logger.info(f"Cleaned up test idea_id {idea_id} from database.")

    logger.info("\nAll tests completed successfully!")

if __name__ == "__main__":
    run_tests()
