import sys
import os
import json
import logging

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("test_e2e_api")

from app import app
from db import execute_query

def run_e2e_tests():
    logger.info("Initializing Flask test client for BizVision AI V2 end-to-end test...")
    client = app.test_client()

    # 1. Test GET /health
    logger.info("Testing GET /health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    health_data = response.get_json()
    logger.info(f"Health status: {health_data}")
    assert health_data["status"] == "healthy", "Expected 'healthy' database status"
    assert health_data["database"] == "connected", "Expected 'connected' database status"
    logger.info("GET /health check PASSED.")

    # 2. Test GET / (index)
    logger.info("Testing GET / endpoint...")
    response = client.get("/")
    assert response.status_code == 200
    index_data = response.get_json()
    logger.info(f"Index status: {index_data}")
    assert index_data["status"] == "online"
    logger.info("GET / check PASSED.")

    # 3. Test POST /analyze (E2E Analysis pipeline)
    test_payload = {
        "idea": "A premium indoor climbing gym with organic juice bar",
        "location": "Seattle, WA",
        "user_id": None
    }
    logger.info(f"Testing POST /analyze with payload: {test_payload}")
    
    response = client.post("/analyze", json=test_payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}. Response: {response.data.decode()}"
    
    res_data = response.get_json()
    logger.info("POST /analyze analysis pipeline completed successfully.")
    
    # Validate payload structure
    expected_keys = ["report_id", "idea_id", "metadata", "report", "competitors", "trends", "news", "shopping"]
    for key in expected_keys:
        assert key in res_data, f"Missing expected key '{key}' in response JSON"
    
    # Validate LLM metadata parsing results
    metadata = res_data["metadata"]
    logger.info(f"Generated metadata: {metadata}")
    assert metadata["idea_text"] == test_payload["idea"], "Parsed idea text mismatch"
    assert "seattle" in metadata["location"].lower(), f"Expected Seattle in location, got: {metadata['location']}"
    assert len(metadata["keywords"]) > 0, "Expected non-empty keywords list/string"
    
    # Check that report is returned and looks valid
    report = res_data["report"]
    assert "hero_summary" in report, "Missing hero_summary in report"
    assert "executive_verdict" in report, "Missing executive_verdict in report"
    assert "market_overview" in report, "Missing market_overview in report"
    
    logger.info("API payload structures and report details validated successfully.")

    # 4. Verify Database Persistence
    idea_id = res_data["idea_id"]
    report_id = res_data["report_id"]
    
    logger.info(f"Verifying DB records. idea_id: {idea_id}, report_id: {report_id}")
    
    db_idea = execute_query("SELECT * FROM business_ideas WHERE id = %s", (idea_id,), fetch="one")
    assert db_idea is not None, "Failed to find business idea in database"
    logger.info(f"Found DB idea: {db_idea}")
    assert db_idea["location"] == metadata["location"]
    assert db_idea["industry"] == metadata["industry"]
    
    db_report = execute_query("SELECT * FROM analysis_reports WHERE id = %s", (report_id,), fetch="one")
    assert db_report is not None, "Failed to find analysis report in database"
    logger.info("Found DB analysis report successfully.")
    
    # 5. Cleanup Test Data
    logger.info("Cleaning up E2E test database records...")
    execute_query("DELETE FROM analysis_reports WHERE id = %s", (report_id,), commit=True)
    execute_query("DELETE FROM search_history WHERE idea_id = %s", (idea_id,), commit=True)
    execute_query("DELETE FROM business_ideas WHERE id = %s", (idea_id,), commit=True)
    logger.info("Database records cleaned up.")
    
    logger.info("End-to-End backend functionality verification: ALL PASSED!")

if __name__ == "__main__":
    run_e2e_tests()
