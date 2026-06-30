import os
import json
from io import BytesIO
from PIL import Image
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types

# Initialize client using environment variable GEMINI_API_KEY
client = genai.Client()

class IssueAnalysisSchema(BaseModel):
    title: str = Field(description="Short, clear title of the issue")
    category: str = Field(description="Category of the issue, e.g., 'Infrastructure', 'Sanitation', 'Safety', 'Other'")
    description: str = Field(description="Expanded, professional description based on the photo and user input")
    severity: str = Field(description="Severity of the issue: 'Low', 'Medium', or 'High'")
    tags: List[str] = Field(description="List of relevant keywords related to the issue")

def analyze_issue(image_bytes: bytes, user_description: str = "") -> IssueAnalysisSchema:
    """
    Analyzes a civic issue image and an optional user description using Gemini.
    Returns a validated Pydantic object containing the structured data.
    """
    # Convert image bytes to PIL Image
    image = Image.open(BytesIO(image_bytes))

    # Construct the prompt
    prompt = (
        "You are an expert civic issue analyst for the CivicPulse application. "
        "Analyze the provided image of a civic issue and the user's description (if any). "
        "Provide a structured JSON output with a clear title, category, expanded professional description, severity level (Low, Medium, High), and relevant tags."
    )
    if user_description:
        prompt += f"\nUser's Description: {user_description}"
    
    # Call Gemini model using structured output
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[image, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IssueAnalysisSchema,
            temperature=0.2,
        ),
    )
    
    # Parse the response text as JSON and validate with Pydantic
    return IssueAnalysisSchema.model_validate_json(response.text)
