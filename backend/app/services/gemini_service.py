import os
from typing import List

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

CHAT_MODEL = "gemini-2.5-flash"

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=api_key)
    return _client


def generate_text(prompt: str, system: str = "") -> str:
    client = _get_client()
    config = types.GenerateContentConfig(system_instruction=system) if system else None
    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text


def chat_with_history(messages: List[dict], system: str = "") -> str:
    """messages = [{"role": "user"|"model", "content": "..."}]. Last must be user."""
    client = _get_client()

    if not messages:
        raise ValueError("messages list is empty")

    contents = [
        types.Content(role=msg["role"], parts=[types.Part(text=msg["content"])])
        for msg in messages
    ]
    config = types.GenerateContentConfig(system_instruction=system) if system else None
    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=contents,
        config=config,
    )
    return response.text
