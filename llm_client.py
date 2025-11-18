import requests
import json
from config.setting import OPENROUTER_API_KEY, OPENROUTER_URL

def call_llm(prompt):
    response = requests.post(
        url=OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Legal Document Analysis API"
        },
        json={
            "model": "google/gemma-3n-e4b-it:free",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        }
    )

    if response.status_code != 200:
        return None, response.text

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(content), None
    except json.JSONDecodeError:
        return {"answer": content}, None
