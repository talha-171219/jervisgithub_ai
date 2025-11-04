from dotenv import load_dotenv

from dotenv import load_dotenv

from flask import Flask, send_from_directory, jsonify, request
import os

# Temporarily comment out LiveKit agent related imports and code for Flask frontend testing
# from livekit import agents
# from livekit.agents import AgentSession, Agent, RoomInputOptions, function_tool
# from livekit.plugins import (
#     google,
#     noise_cancellation,
# )
# from Jarvis_prompts import behavior_prompts
# from Jarvis_google_search import google_search, get_current_datetime
# from jarvis_get_whether import get_weather
# from Jarvis_window_CTRL import open, close, folder_file
# from Jarvis_file_opner import Play_file
# from keyboard_mouse_CTRL import move_cursor_tool, mouse_click_tool, scroll_cursor_tool, type_text_tool, press_key_tool, swipe_gesture_tool, press_hotkey_tool, control_volume_tool

load_dotenv()

app = Flask(__name__, static_folder='frontend', static_url_path='')

# LiveKit API Key and Secret from environment variables (still needed for token endpoint)
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://jarvis-ai-agent.onrender.com") # Default to Render URL

# Temporarily comment out Assistant class and entrypoint function
# class Assistant(Agent):
#     def __init__(self) -> None:
#         super().__init__(instructions=behavior_prompts,
#                          tools=[
#                             google_search,
#                             get_current_datetime,
#                             get_weather,
#                             open, #এটি অ্যাপস খোলার জন্য
#                             close, 
#                             folder_file, #এটি ফোল্ডার খোলার জন্য
#                             Play_file,  #এটি ফাইল চালানোর জন্য যেমন MP4, MP3, PDF, PPT, img, png ইত্যাদি।
#                             move_cursor_tool, #এটি কার্সার সরানোর জন্য
#                             mouse_click_tool, #এটি মাউস ক্লিক করার জন্য
#                             scroll_cursor_tool, #এটি কার্সার স্ক্রল করার জন্য
#                             type_text_tool, #এটি টেক্সট টাইপ করার জন্য
#                             press_key_tool, #এটি কী চাপার জন্য
#                             press_hotkey_tool, #এটি হটকি চাপার জন্য
#                             control_volume_tool, #এটি ভলিউম নিয়ন্ত্রণ করার জন্য
#                             swipe_gesture_tool #এটি সোয়াইপ জেসচার করার জন্য 
#                          ]
#                          )


# async def entrypoint(ctx: agents.JobContext):
#     session = AgentSession(
#         llm=google.beta.realtime.RealtimeModel(
#             voice="Charon"
#         )
#     )
    
#     await session.start(
#         room=ctx.room,
#         agent=Assistant(),
#         room_input_options=RoomInputOptions(
#             noise_cancellation=noise_cancellation.BVC(),
#             video_enabled=True 
#         ),
#     )

#     await ctx.connect()

#     current_time = get_current_datetime()
#     weather_info = await get_weather()
    
#     initial_greeting = f"আসসালামু আলাইকুম ওয়া রহমাতুল্লাহি ওয়া বারাকাতুহু। আজকের তারিখ ও সময় হলো {current_time}। আজকের আবহাওয়া হলো {weather_info}। আমি জার্ভিস, তালহার ব্যক্তিগত এআই সহকারী।"

#     await session.generate_reply(
#         instructions=initial_greeting
#     )

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/token', methods=['GET'])
def get_token():
    # Temporarily mock token generation for Flask frontend testing
    # In a real LiveKit setup, you would use livekit.api.AccessToken and VideoGrant
    # For now, return a dummy token or an error if LiveKit API keys are missing
    return jsonify({"token": "dummy_token_for_testing"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
