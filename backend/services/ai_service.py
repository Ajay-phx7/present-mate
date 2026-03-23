import os
import json
from openai import AsyncOpenAI
from schemas.presentation import SlideSummary

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_slide_summary(slide_number: int, text: str) -> SlideSummary:
    """
    Calls OpenAI to generate summary, key points, and likely questions for a given slide text.
    """
    prompt = f"""
    You are an AI assistant helping a presenter. Given the text from a presentation slide, extract the following:
    1. A concise 2-4 line summary.
    2. 3-5 key talking points.
    3. 2-4 likely questions the audience might ask about this slide.
    
    Slide Text: "{text}"
    
    Respond in strict JSON payload matching this format:
    {{
        "summary": "...",
        "key_points": ["...", "..."],
        "likely_questions": ["...", "..."]
    }}
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        result_content = response.choices[0].message.content
        data = json.loads(result_content)
        
        return SlideSummary(
            slide_number=slide_number,
            raw_text=text,
            summary=data.get("summary", ""),
            key_points=data.get("key_points", []),
            likely_questions=data.get("likely_questions", [])
        )
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return SlideSummary(
            slide_number=slide_number,
            raw_text=text,
            summary="Failed to generate summary.",
            key_points=[],
            likely_questions=[]
        )

async def generate_qa_hint(question: str, slide_context: dict) -> dict:
    """
    Generates a concise hint for a live audience question based on the slide context.
    """
    prompt = f"""
    You are an AI assistant helping a presenter answer a live audience question. 
    You have context about the current slide being displayed.
    
    Current Slide Summary: {slide_context.get('summary')}
    Current Slide Key Points: {slide_context.get('key_points')}
    
    Audience Question: "{question}"
    
    Provide:
    1. A concise, correct answer hint (1-2 sentences). NOT a fully scripted response.
    2. 3 brief talking points to support the answer.
    
    Respond in strict JSON payload matching this format:
    {{
        "answer_hint": "...",
        "talking_points": ["...", "..."]
    }}
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        result_content = response.choices[0].message.content
        data = json.loads(result_content)
        
        return {
            "answer_hint": data.get("answer_hint", ""),
            "talking_points": data.get("talking_points", [])
        }
    except Exception as e:
        print(f"Error calling OpenAI API for QA: {e}")
        return {
            "answer_hint": "Could not generate hint for this question.",
            "talking_points": []
        }
