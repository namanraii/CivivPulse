import os
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

client = genai.Client()

class EscalationLetterSchema(BaseModel):
    subject: str = Field(description="A formal and urgent subject line for the email")
    body: str = Field(description="The formal body of the email addressed to the City Council, demanding action")

def draft_escalation(title: str, description: str, severity: str, urgency_score: int, upvotes: int, category: str) -> EscalationLetterSchema:
    """
    Drafts a formal escalation letter to the City Council using Gemini.
    """
    prompt = (
        "You are an AI assistant acting on behalf of concerned citizens using the CivicPulse platform. "
        "Your task is to draft a formal, urgent, and highly professional escalation email to the City Council "
        "demanding action on a high-priority civic issue.\n\n"
        "Here are the details of the issue:\n"
        f"Title: {title}\n"
        f"Category: {category}\n"
        f"Description: {description}\n"
        f"Base Severity: {severity}\n"
        f"Dynamic Urgency Score: {urgency_score}/100\n"
        f"Community Upvotes: {upvotes}\n\n"
        "Instructions:\n"
        "1. Ensure the tone is respectful but firm, emphasizing the high urgency score and community backing (upvotes).\n"
        "2. Provide a structured JSON output with 'subject' and 'body'.\n"
        "3. Keep the body concise (around 3-4 paragraphs) and clearly state the required action."
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=EscalationLetterSchema,
            temperature=0.3,
        ),
    )
    
    return EscalationLetterSchema.model_validate_json(response.text)
