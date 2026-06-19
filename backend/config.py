import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend/ directory regardless of working directory
dotenv_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path, override=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "bizvision_ai_super_secret_key_12345")
    
    # Database configuration (use DATABASE_URL for Aiven cloud, or individual settings for local)
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_NAME = os.getenv("DB_NAME", "bizvision_ai")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
    
    # Third-party APIs
    SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
