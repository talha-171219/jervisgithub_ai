from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    google,
    noise_cancellation,
)
from Jarvis_prompts import behavior_prompts, Reply_prompts
from Jarvis_google_search import google_search, get_current_datetime
from jarvis_get_whether import get_weather
from Jarvis_window_CTRL import open, close, folder_file
from Jarvis_file_opner import Play_file
from keyboard_mouse_CTRL import move_cursor_tool, mouse_click_tool, scroll_cursor_tool, type_text_tool, press_key_tool, swipe_gesture_tool, press_hotkey_tool, control_volume_tool
load_dotenv()


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=behavior_prompts,
                         tools=[
                            google_search,
                            get_current_datetime,
                            get_weather,
                            open, #এটি অ্যাপস খোলার জন্য
                            close, 
                            folder_file, #এটি ফোল্ডার খোলার জন্য
                            Play_file,  #এটি ফাইল চালানোর জন্য যেমন MP4, MP3, PDF, PPT, img, png ইত্যাদি।
                            move_cursor_tool, #এটি কার্সার সরানোর জন্য
                            mouse_click_tool, #এটি মাউস ক্লিক করার জন্য
                            scroll_cursor_tool, #এটি কার্সার স্ক্রল করার জন্য
                            type_text_tool, #এটি টেক্সট টাইপ করার জন্য
                            press_key_tool, #এটি কী চাপার জন্য
                            press_hotkey_tool, #এটি হটকি চাপার জন্য
                            control_volume_tool, #এটি ভলিউম নিয়ন্ত্রণ করার জন্য
                            swipe_gesture_tool #এটি সোয়াইপ জেসচার করার জন্য 
                         ]
                         )


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            voice="Charon"
        )
    )
    
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
            video_enabled=True 
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions=Reply_prompts
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
