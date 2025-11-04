import os
import requests
import logging
from dotenv import load_dotenv
from livekit.agents import function_tool  # ✅ Correct decorator
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@function_tool
async def google_search(query: str) -> str:
    logger.info(f"কোয়েরি (Query) পাওয়া গেছে: {query}")

    api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
    search_engine_id = os.getenv("SEARCH_ENGINE_ID")

    if not api_key or not search_engine_id:
        logger.error("API কী বা সার্চ ইঞ্জিন আইডি অনুপস্থিত।")
        return "এনভায়রনমেন্ট ভেরিয়েবল (Environment variables) এ API কী বা সার্চ ইঞ্জিন আইডি অনুপস্থিত।"

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": search_engine_id,
        "q": query,
        "num": 3
    }

    logger.info("গুগল কাস্টম সার্চ এপিআই (Google Custom Search API) এ অনুরোধ পাঠানো হচ্ছে...")
    response = requests.get(url, params=params)

    if response.status_code != 200:
        logger.error(f"গুগল এপিআই (Google API) এ ত্রুটি হয়েছে: {response.status_code} - {response.text}")
        return f"গুগল সার্চ এপিআই (Google Search API) এ ত্রুটি হয়েছে: {response.status_code} - {response.text}"

    data = response.json()
    results = data.get("items", [])

    if not results:
        logger.info("কোনো ফলাফল পাওয়া যায়নি।")
        return "কোনো ফলাফল পাওয়া যায়নি।"

    formatted = ""
    logger.info("অনুসন্ধানের ফলাফল:")
    for i, item in enumerate(results, start=1):
        title = item.get("title", "No title")
        link = item.get("link", "No link")
        snippet = item.get("snippet", "")
        formatted += f"{i}. {title}\n{link}\n{snippet}\n\n"
        logger.info(f"{i}. {title}\n{link}\n{snippet}\n")

    return formatted.strip()

@function_tool
async def get_current_datetime() -> str:
    return datetime.now().isoformat()
