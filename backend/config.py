import os
from dotenv import load_dotenv

# Load environment variables from .env file, overriding system variables
load_dotenv(override=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "bizvision_ai_super_secret_key_12345")
    
    # Database configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_NAME = os.getenv("DB_NAME", "bizvision_ai")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
    
    # Third-party APIs
    SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
