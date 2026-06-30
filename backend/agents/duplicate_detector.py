from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from typing import List

client = genai.Client()

class DuplicateCheckResult(BaseModel):
    is_duplicate: bool = Field(description="True if the new issue is likely a duplicate of an existing one")
    duplicate_of_id: str | None = Field(description="The ID of the existing issue if a duplicate is found, otherwise null")
    reasoning: str = Field(description="Brief explanation of why it is or isn't a duplicate")

def check_duplicate(new_issue_title: str, new_issue_desc: str, existing_issues: List[dict]) -> DuplicateCheckResult:
    """
    Checks if a newly reported issue is a duplicate of existing recent issues.
    """
    if not existing_issues:
        return DuplicateCheckResult(is_duplicate=False, duplicate_of_id=None, reasoning="No existing issues to compare against.")

    issues_context = "\n".join([
        f"Issue ID: {issue.get('id')}\nTitle: {issue.get('title')}\nDescription: {issue.get('description')}\n---"
        for issue in existing_issues
    ])

    prompt = (
        "You are an AI assistant for a civic reporting platform. Your task is to detect duplicate reports.\n"
        "A user just submitted a new issue. Compare it against the following list of recent issues and determine if it describes the EXACT SAME problem in the SAME location.\n\n"
        f"NEW ISSUE:\nTitle: {new_issue_title}\nDescription: {new_issue_desc}\n\n"
        "RECENT ISSUES:\n"
        f"{issues_context}\n\n"
        "Instructions:\n"
        "1. Be conservative. Only flag as duplicate if you are highly confident it's the same physical issue.\n"
        "2. If it is a duplicate, return is_duplicate: true and the corresponding duplicate_of_id.\n"
        "3. Provide a brief reasoning for your decision."
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DuplicateCheckResult,
            temperature=0.1,
        ),
    )
    
    return DuplicateCheckResult.model_validate_json(response.text)
