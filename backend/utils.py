import re

# Stop words to filter out for keyword extraction
STOP_WORDS = {
    'i', 'want', 'to', 'start', 'a', 'an', 'the', 'business', 'company', 'startup',
    'in', 'at', 'for', 'on', 'with', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'my', 'our', 'your', 'his', 'her', 'their', 'we', 'you', 'they', 'he', 'she',
    'open', 'create', 'build', 'launch', 'run', 'service', 'store', 'shop', 'online',
    'local', 'platform', 'app', 'website', 'sell', 'selling', 'provide', 'providing'
}

# Industry keyword dictionary
INDUSTRIES = {
    "Pet Care": ["pet", "dog", "cat", "animal", "vet", "veterinary", "pets", "dogs", "cats"],
    "Food & Beverage": ["food", "beverage", "restaurant", "cafe", "organic", "bakery", "meal", "coffee", "juice", "dining", "eats", "cook"],
    "Healthcare & Wellness": ["health", "fitness", "gym", "wellness", "medical", "clinic", "therapy", "yoga", "nutrition", "supplement", "organic", "pet food"],
    "Technology & SaaS": ["software", "saas", "tech", "ai", "platform", "cloud", "app", "mobile app", "digital", "iot", "vr", "ar", "api"],
    "Retail & E-commerce": ["retail", "ecommerce", "e-commerce", "shop", "store", "boutique", "market", "clothing", "fashion", "apparel", "goods"],
    "Education & EdTech": ["education", "school", "course", "learning", "tutorial", "tutor", "academy", "training", "edtech", "study"],
    "Real Estate": ["property", "real estate", "housing", "apartment", "rent", "broker", "office", "space"],
    "Finance & FinTech": ["finance", "fintech", "payment", "bank", "invest", "crypto", "trading", "wallet", "insurance"],
    "Agriculture": ["organic", "farming", "farm", "agriculture", "crops", "hydroponics", "livestock"],
    "Hospitality & Tourism": ["hotel", "motel", "resort", "travel", "tourism", "stay", "hostel", "inn", "lodging"]
}

# Business Type dictionary
BUSINESS_TYPES = {
    "E-commerce / Online Store": ["ecommerce", "e-commerce", "online", "shopify", "website", "web store", "dropshipping", "delivery"],
    "SaaS / Software Product": ["saas", "software", "app", "platform", "subscription", "cloud", "dashboard", "b2b software"],
    "Brick-and-Mortar / Retail Shop": ["store", "shop", "boutique", "supermarket", "grocery", "showroom", "physical"],
    "Food Service / Restaurant": ["restaurant", "cafe", "food truck", "bakery", "kitchen", "pizzeria", "coffee shop", "veg", "vegetarian", "dhaba", "diner", "dining"],
    "Service Business / Agency": ["agency", "consulting", "service", "cleaning", "plumbing", "tutor", "coaching", "spa", "salon", "design"],
    "Marketplace / Platform": ["marketplace", "directory", "platform", "matching", "uber for", "booking"],
    "Manufacturing / Production": ["factory", "production", "manufacture", "craft", "brewery", "maker"],
    "Hospitality / Lodging": ["hotel", "motel", "resort", "hostel", "inn", "stay", "lodging"]
}

def extract_location(text):
    """Extract location using prepositional patterns and uppercase city detection."""
    # Look for patterns like "in Hyderabad", "in ameerpet", "based in New York"
    patterns = [
        r"(?:in|at|based in|located in|for|around|near)\s+([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*)",
        r"([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:based|located|market|area|city)"
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            location = matches[0].strip()
            # Skip generic words that aren't actual locations
            if location.lower() not in ("here", "there", "online", "global", "local", "india", "your area"):
                return location.title()
            
    # Fallback to checking words for potential location names
    location_preps = {"in", "at", "near", "around", "for"}
    words = text.split()
    for i, word in enumerate(words):
        lower = word.strip(",.!?;:").lower()
        if i > 0 and words[i-1].strip(",.!?;:").lower() in location_preps and len(lower) > 2 and lower not in STOP_WORDS:
            return word.strip(",.!?;:").title()
            
    return "Global / Online"

def extract_industry(text):
    """Detect industry classification based on keyword matches."""
    text_lower = text.lower()
    matches = {}
    
    for industry, keywords in INDUSTRIES.items():
        score = 0
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                score += 2
            elif keyword in text_lower:
                score += 1
        if score > 0:
            matches[industry] = score
            
    if matches:
        # Return industry with highest score
        return max(matches, key=matches.get)
    return "General Business"

def extract_business_type(text):
    """Detect business type category based on keyword matches."""
    text_lower = text.lower()
    matches = {}
    
    for b_type, keywords in BUSINESS_TYPES.items():
        score = 0
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                score += 2
            elif keyword in text_lower:
                score += 1
        if score > 0:
            matches[b_type] = score
            
    if matches:
        return max(matches, key=matches.get)
        
    # Default heuristics
    if "online" in text_lower or "web" in text_lower:
        return "E-commerce / Online Store"
    if "app" in text_lower or "software" in text_lower or "saas" in text_lower:
        return "SaaS / Software Product"
    return "Service Business / Agency"

def extract_keywords(text):
    """Extract and filter main descriptive words/phrases."""
    # Remove location phrase if possible to keep keywords clean
    clean_text = re.sub(r'\b(?:in|at|based in|located in|for)\s+[A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*', '', text)
    
    # Remove non-alphanumeric chars (keep spaces)
    words = re.findall(r'\b[a-zA-Z\-]+\b', clean_text.lower())
    
    # Filter out stop words and small words
    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]
    
    # Take unique keywords preserving order
    seen = set()
    unique_words = []
    for w in filtered_words:
        if w not in seen:
            seen.add(w)
            unique_words.append(w)
            
    # Return first 4-5 words joined, or full list
    if unique_words:
        return ", ".join(unique_words[:5])
    return "startup idea"

def parse_idea(text):
    """Run all extraction methods and compile structured idea data."""
    return {
        "idea_text": text,
        "keywords": extract_keywords(text),
        "location": extract_location(text),
        "industry": extract_industry(text),
        "business_type": extract_business_type(text)
    }
