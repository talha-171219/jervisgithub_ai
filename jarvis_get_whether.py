import os
import requests
import logging
from dotenv import load_dotenv
from livekit.agents import function_tool  # ✅ Correct decorator

load_dotenv()


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def detect_city_by_ip() -> str:
    try:
        logger.info("আইপি (IP) এর মাধ্যমে শহর সনাক্ত করার চেষ্টা করা হচ্ছে")
        ip_info = requests.get("https://ipapi.co/json/").json()
        city = ip_info.get("city")
        if city:
            logger.info(f"আইপি (IP) থেকে শহর সনাক্ত করা হয়েছে: {city}")
            return city
        else:
            logger.warning("শহর সনাক্তকরণে ব্যর্থ, ডিফল্ট 'ঢাকা' ব্যবহার করা হচ্ছে।")
            return "Dhaka"
    except Exception as e:
        logger.error(f"আইপি (IP) থেকে শহর সনাক্তকরণে ত্রুটি হয়েছে: {e}")
        return "Dhaka"

@function_tool
async def get_weather(city: str = "") -> str:
    
    api_key = os.getenv("OPENWEATHER_API_KEY")

    if not api_key:
        logger.error("OpenWeather API কী অনুপস্থিত।")
        return "এনভায়রনমেন্ট ভেরিয়েবল (Environment variables) এ OpenWeather API কী পাওয়া যায়নি।"

    if not city:
        city = detect_city_by_ip()

    logger.info(f"শহরের জন্য আবহাওয়া আনা হচ্ছে: {city}")
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric"
    }

    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            logger.error(f"OpenWeather API তে ত্রুটি হয়েছে: {response.status_code} - {response.text}")
            return f"ত্রুটি: {city} এর জন্য আবহাওয়া আনা যায়নি। অনুগ্রহ করে শহরের নামটি পরীক্ষা করুন।"

        data = response.json()
        weather = data["weather"][0]["description"].title()
        temperature = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        wind_speed = data["wind"]["speed"]

        result = (f"{city} এর আবহাওয়া:\n"
                  f"- অবস্থা: {weather}\n"
                  f"- তাপমাত্রা: {temperature}°C\n"
                  f"- আর্দ্রতা: {humidity}%\n"
                  f"- বাতাসের গতি: {wind_speed} মি/সে")

        logger.info(f"আবহাওয়ার ফলাফল: \n{result}")
        return result

    except Exception as e:
        logger.exception(f"আবহাওয়া আনার সময় একটি ব্যতিক্রম ঘটেছে: {e}")
        return "আবহাওয়া আনার সময় একটি ত্রুটি ঘটেছে"
