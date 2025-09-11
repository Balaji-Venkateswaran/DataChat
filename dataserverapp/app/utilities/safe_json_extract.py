import json
from typing import List
def safe_json_extract(raw_content: str, max_questions: int = 5) -> List[str]:
    if raw_content.startswith("```json"):
        raw_content = raw_content.replace("```json", "").replace("```", "").strip()
    elif raw_content.startswith("```"):
        raw_content = raw_content.replace("```", "").strip()

    try:
        questions = json.loads(raw_content)
        if isinstance(questions, list):
            return [str(q).strip() for q in questions[:max_questions] if str(q).strip()]
    except Exception:
        pass

    lines = [line.strip().strip('"') for line in raw_content.split("\n") if line.strip()]
    return [q for q in lines[:max_questions] if len(q) > 5]