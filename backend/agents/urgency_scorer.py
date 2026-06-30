import os
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Initialize client using environment variable GEMINI_API_KEY
client = genai.Client()

class UrgencyScoreSchema(BaseModel):
    urgency_score: int = Field(description="Dynamic priority score from 1 to 100")
    justification: str = Field(description="1-2 sentence explanation of why this score was given based on severity, category, and upvotes")

def calculate_urgency(title: str, category: str, description: str, severity: str, upvotes: int) -> UrgencyScoreSchema:
    """
    Calculates a dynamic urgency score (1-100) for a civic issue using Gemini.
    Returns a validated Pydantic object containing the score and justification.
    """
    prompt = (
        "You are an expert civic operations manager. Your job is to assign a dynamic "
        "urgency score (1 to 100) to civic issues to help prioritize city resources.\n\n"
        "Consider the following factors:\n"
        "1. Base Severity (Low, Medium, High)\n"
        "2. Category (Safety issues usually have higher priority than cosmetic issues)\n"
        "3. Community Upvotes (Higher upvotes indicate broader community impact)\n\n"
        "Issue Details:\n"
        f"Title: {title}\n"
        f"Category: {category}\n"
        f"Description: {description}\n"
        f"Severity: {severity}\n"
        f"Upvotes: {upvotes}\n\n"
        "Provide a structured JSON output with the integer 'urgency_score' and a brief 'justification'."
    )
    
    # Call Gemini model using structured output (using gemini-2.5-flash as default fast model)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=UrgencyScoreSchema,
            temperature=0.1,
        ),
    )
    
    # Parse the response text as JSON and validate with Pydantic
    return UrgencyScoreSchema.model_validate_json(response.text)
