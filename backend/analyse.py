import json
import sys #used to talk to the system
import re
import requests 

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def clean_text_list(text_list):
    if not isinstance(text_list, list):
        text_list = [text_list] if text_list is not None else []
    
    cleaned_texts = []
    #cleaning tweets so that req can be sent in proper format
    for t in text_list:
        if isinstance(t, str):
            text = t.strip()
            text = re.sub(r'http\S+|https\S+|www\S+', '', text, flags=re.MULTILINE) 
            text = re.sub(r'@\w+', '', text) 
            text = re.sub(r'#\w+', '', text) 
            text = re.sub(r'[^\x00-\x7F]+', ' ', text) 
            text = re.sub(r'\s+', ' ', text).strip() 
            if text:
                cleaned_texts.append(text)
    return cleaned_texts

def call_gemini_api(prompt_text, gemini_api_key, response_schema=None):
    if not gemini_api_key:
        return "AI Summary Error: Gemini API Key is not found."

    headers = {
        'Content-Type': 'application/json',
    }
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }
    if response_schema:
        payload["generationConfig"] = {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }

    try:
        response = requests.post(f"{GEMINI_API_URL}?key={gemini_api_key}", headers=headers, data=json.dumps(payload))
        response.raise_for_status() 
        
        result = response.json()
        
        if result.get("candidates") and result["candidates"][0].get("content") and result["candidates"][0]["content"].get("parts"):
            response_text = result["candidates"][0]["content"]["parts"][0]["text"]
            if response_schema:
                try:
                    return json.loads(response_text)
                except json.JSONDecodeError:
                    print(f"DEBUG: Failed to parse JSON from Gemini: {response_text}", file=sys.stderr)
                    return {"error": "AI Summary: Failed to parse structured JSON response."}
            return response_text
        else:
            print(f"DEBUG: Unexpected Gemini API response structure: {json.dumps(result)}", file=sys.stderr)
            return "AI Summary: Could not generate summary due to unexpected API response."

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}", file=sys.stderr)
        return f"AI Summary Error: Failed to connect to AI service. {e}"
    except Exception as e:
        print(f"An unexpected error occurred during AI summarization: {e}", file=sys.stderr)
        return f"AI Summary Error: An internal error occurred. {e}"

def summarize_tweets_with_gemini_genz(then_texts, now_texts, gemini_api_key):

    then_corpus = "\n".join(then_texts) if then_texts else "No 'then' tweets provided."
    now_corpus = "\n".join(now_texts) if now_texts else "No 'now' tweets provided."

    prompt_text = f"""
Analyze the following two sets of tweets:

--- THEN TWEETS ---
{then_corpus}

--- NOW TWEETS ---
{now_corpus}

Provide a super concise summary (exactly 2 lines, GenZ style) comparing the vibe, main themes, or focus of the "THEN TWEETS" versus the "NOW TWEETS". Keep it short and punchy.
"""
    return call_gemini_api(prompt_text, gemini_api_key)

def identify_and_summarize_topic(tweets_list, period_name, gemini_api_key):
    
    corpus = "\n".join(tweets_list) if tweets_list else f"No {period_name} tweets provided."
    
    prompt_text = f"""
Analyze the following set of tweets from the "{period_name}" period:

--- {period_name.upper()} TWEETS ---
{corpus}

Based on these tweets, identify the single most prevalent topic or theme.
Then, provide a small paragraph (3-5 sentences) summarizing this topic and how it's discussed in these tweets.

Return the response as a JSON object with two keys: "topic_name" (string) and "summary_paragraph" (string).
Example: {{"topic_name": "Coding Challenges", "summary_paragraph": "Tweets from this period often discuss coding problems, debugging, and sharing solutions, reflecting a strong focus on practical development hurdles."}}
"""
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "topic_name": {"type": "STRING"},
            "summary_paragraph": {"type": "STRING"}
        },
        "required": ["topic_name", "summary_paragraph"]
    }
    result = call_gemini_api(prompt_text, gemini_api_key, response_schema)
    
    if isinstance(result, dict) and "topic_name" in result and "summary_paragraph" in result:
        return result
    else:
        return {
            "topic_name": f"Error/No Topic ({period_name})",
            "summary_paragraph": result # Will contain the error message if something went wrong
        }

def analyze_personality_genz(tweets_list, period_name, gemini_api_key):
   
    corpus = "\n".join(tweets_list) if tweets_list else f"No {period_name} tweets provided for personality analysis."

    prompt_text = f"""
Analyze the following tweets from the "{period_name}" period:

--- {period_name.upper()} TWEETS ---
{corpus}

Describe the personality evident in these tweets using 3-5 GenZ-style keywords or short phrases.
Return the response as a JSON object with a single key: "personality_keywords" (array of strings).
Example: {{"personality_keywords": ["chill", "vibing", "low-key techie", "savage", "main character energy"]}}
"""
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "personality_keywords": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["personality_keywords"]
    }
    result = call_gemini_api(prompt_text, gemini_api_key, response_schema)

    if isinstance(result, dict) and "personality_keywords" in result and isinstance(result["personality_keywords"], list):
        return result["personality_keywords"]
    else:
        print(f"DEBUG: Failed to get structured personality keywords for {period_name}: {result}", file=sys.stderr)
        return [f"Error/No Personality ({period_name})"]

def give_advice_with_gemini(then_texts, now_texts, gemini_api_key):
   
    then_corpus = "\n".join(then_texts) if then_texts else "No 'then' tweets provided."
    now_corpus = "\n".join(now_texts) if now_texts else "No 'now' tweets provided."

    prompt_text = f"""
Based on the following comparison of "then" and "now" tweets, offer some friendly, constructive advice (1-2 paragraphs) on areas the user might consider improving or focusing on for growth. Keep the tone encouraging and supportive.

--- THEN TWEETS ---
{then_corpus}

--- NOW TWEETS ---
{now_corpus}

Advice:
"""
    return call_gemini_api(prompt_text, gemini_api_key)


def perform_analysis(then_tweets_list, now_tweets_list, gemini_api_key=None):
    
    then_clean = clean_text_list(then_tweets_list)
    now_clean = clean_text_list(now_tweets_list)

    ai_overall_summary = summarize_tweets_with_gemini_genz(then_clean, now_clean, gemini_api_key)
    
    ai_most_used_topic_then_data = identify_and_summarize_topic(then_clean, "then", gemini_api_key)
    ai_most_used_topic_now_data = identify_and_summarize_topic(now_clean, "now", gemini_api_key)

    ai_personality_then = analyze_personality_genz(then_clean, "then", gemini_api_key)
    ai_personality_now = analyze_personality_genz(now_clean, "now", gemini_api_key)

    
    ai_advice = give_advice_with_gemini(then_clean, now_clean, gemini_api_key)
    
    return {
        "summary": ai_overall_summary,
        "Topic then": ai_most_used_topic_then_data["topic_name"],
        "Summary then": ai_most_used_topic_then_data["summary_paragraph"],
        "Topic now": ai_most_used_topic_now_data["topic_name"],
        "Summary now": ai_most_used_topic_now_data["summary_paragraph"],
        "Personality then": ai_personality_then,
        "Personality now": ai_personality_now,
        "Advice": ai_advice, 
    }

if __name__ == "__main__":
    try:
        input_json_str = sys.stdin.read()
        input_data = json.loads(input_json_str)
        
        then_texts = input_data.get("then", [])
        now_texts = input_data.get("now", [])
        gemini_api_key = input_data.get("gemini_api_key")

        result = perform_analysis(then_texts, now_texts, gemini_api_key=gemini_api_key)
        
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"An unexpected error occurred: {e}"}), file=sys.stderr)
        sys.exit(1)