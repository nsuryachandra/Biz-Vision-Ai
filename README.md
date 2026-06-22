# BizVision AI — Startup Intelligence & Market Validation Platform

BizVision AI is a premium, McKinsey-inspired SaaS application designed to validate business concepts before investing capital. The platform leverages SerpAPI to query Google Search, Trends, News, and Maps, and utilizes Groq (Llama-3.3) and Google Gemini to build detailed text reports, operational risks, competitor spreadsheets, and brand name viability profiles.

## Project Structure
```text
bizvision-ai/
├── backend/            # Flask Python API server
│   ├── app.py          # Main entrypoint
│   ├── routes.py       # API routing and business flows
│   ├── db.py           # Aiven MySQL database driver
│   ├── services.py     # SerpAPI connections & mock fallbacks
│   ├── prompt_engine.py# LLM dynamic prompt templates
│   ├── analysis_engine.py # Quantitative scoring algorithm
│   └── schema.sql      # MySQL schema definition
└── frontend/           # React Single Page App (Vite)
    ├── src/
    │   ├── App.jsx     # Main page router
    │   ├── components/ # Landing page and canvas video components
    │   └── pages/      # Report, History, and Processing pages
    └── package.json    # React dependencies
```

---

## Getting Started

### 1. Backend Setup (Flask Server)
Navigate to the `backend` directory, create a virtual environment, install dependencies, and run the server:

```bash
cd backend
python -m venv venv
source venv/Scripts/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create/modify the `.env` file with your details:
```ini
DATABASE_URL=mysql://avnadmin:PASSWORD@HOST:PORT/bizvision_ai?ssl-mode=REQUIRED
SERPAPI_KEY=YOUR_SERPAPI_KEY_HERE
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

Run the Flask server:
```bash
python app.py
```
The server will start at `http://127.0.0.1:5000`.

### 2. Frontend Setup (React App)
Open another terminal, navigate to the `frontend` directory, install Node dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```
The Vite server will start at `http://localhost:5173`.

---

## Core Features
1. **Startup Idea Parser**: Extracts primary keywords, location constraints, industry types, and delivery models.
2. **Web, Maps, News, & Trend Intelligence**: Aggregates SerpAPI data to evaluate local business locations, consumer interest over time, news sentiment, and search volume.
3. **Scorecard Algorithm**: Computes numerical scores for Viability, Opportunity, Competitor Density, and Risk.
4. **Consultant Heuristic engine**: Synthesizes Gemini prompt templates into high-fidelity, McKinsey-grade business viability analyses.
