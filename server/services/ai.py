import os
import json
import httpx
from typing import Dict, Any, List

SYSTEM_PROMPT = """You are MavunoGuard AI, a Kenyan smallholder-farm decision assistant. Give practical, low-cost actions based only on the supplied evidence. Never invent measurements. Clearly distinguish observed data from interpretation. Use short, simple sentences understandable at a glance.

You must respond ONLY with a valid JSON object with the following structure:
{
  "headline": "Short, clear summary (max 10 words)",
  "explanation": "Clear, grounded explanation of current climate and crop conditions (max 3 sentences)",
  "actions": ["Action 1: specific and low cost", "Action 2", "Action 3"],
  "watch_next": ["Monitoring tip 1", "Monitoring tip 2"],
  "confidence_note": "Brief note stating data confidence based on provided evidence"
}
"""

def generate_rule_based_advice(risk_res: Dict[str, Any], farm: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    level = risk_res.get("risk_level", "MODERATE")
    drought = risk_res.get("drought_risk", 0)
    flood = risk_res.get("flood_risk", 0)
    crop = farm.get("crop", "Crop")

    if lang == "sw":
        if drought >= 50:
            headline = f"Tahadhari ya Ukame kwa {crop}"
            explanation = "Unyevu wa udongo umepungua na mvua chache inatarajiwa. Linda unyevu uliopo kwenye shamba."
        elif flood >= 50:
            headline = f"Tahadhari ya Mafuriko kwa {crop}"
            explanation = "Mvua nyingi inatarajiwa. Fungua mifereji ya maji ili kuzuia mizizi kuoza."
        else:
            headline = f"Hali ya Kawaida kwa Shamba la {crop}"
            explanation = "Hali ya hewa na mazingira ya shamba yako tulivu. Endelea na taratibu za kawaida za kilimo."
        confidence_note = "Ushauri wa dharura wa sheria za msingi (Huduma ya AI haipatikani kwa sasa)."
    elif lang == "ek":
        if drought >= 50:
            headline = f"Okobung'a kw'enyancha ku {crop}"
            explanation = "Enyancha neyieire ase oborimi. Beka amanyasi kobisa amache ase emiezi."
        elif flood >= 50:
            headline = f"Amache amange ku {crop}"
            explanation = "Amache amange nayache. Tiga koranga amache ase ebirero."
        else:
            headline = f"Oborimi bwa {crop} mbobuya"
            explanation = "Erieire ria rigeria nigo riri buya. Genda amaso n'oborimi bwao."
        confidence_note = "Amasikani amakobua goetera emikwa y'oborimi (AI tekoira bono)."
    else:
        if drought >= 50:
            headline = f"Moisture Conservation Priority for {crop}"
            explanation = f"Deficit rainfall and high evaporation create significant drought risk for your {crop}. Prioritize soil water retention."
        elif flood >= 50:
            headline = f"Drainage Management Priority for {crop}"
            explanation = f"Heavy precipitation patterns create waterlogging risk. Ensure excess water can escape field root zones."
        else:
            headline = f"Stable Growing Conditions for {crop}"
            explanation = f"Current climatic and soil conditions are within safe operational limits for {crop} development."
        confidence_note = "Rule-based agricultural guidelines (AI advisor currently unavailable)."

    return {
        "headline": headline,
        "explanation": explanation,
        "actions": risk_res.get("recommended_actions", [
            "Inspect soil moisture at 10cm depth each morning.",
            "Maintain weed-free zones around crop stems to save moisture."
        ]),
        "watch_next": risk_res.get("watch_next", [
            "Monitor leaf turgidity during mid-day heat.",
            "Check local 3-day weather update."
        ]),
        "confidence_note": confidence_note,
        "provider": "Deterministic Rule-Based",
        "language": lang
    }

async def get_gemini_advice(evidence: Dict[str, Any], lang: str = "en") -> Optional[Dict[str, Any]]:
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return None

    model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"

    lang_instruction = "Respond in English."
    if lang == "sw":
        lang_instruction = "Respond entirely in authentic, fluent Kiswahili agricultural terms."
    elif lang == "ek":
        lang_instruction = "Respond in Ekegusii (Kisii) agricultural terms if possible, or simple Kiswahili/Ekegusii mix."

    prompt = f"""Language requirement: {lang_instruction}

Evidence supplied for smallholder farm:
Farm Information: {json.dumps(evidence.get('farm', {}))}
Weather Assessment: {json.dumps(evidence.get('weather', {}))}
Deterministic Risk Results: {json.dumps(evidence.get('risk', {}))}
Satellite Sentinel-2 Data: {json.dumps(evidence.get('satellite', {}))}
Farmer Field Observations: {json.dumps(evidence.get('observations', []))}

Generate the structured JSON response according to the instructions."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                res_data = resp.json()
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text.strip())
                parsed["provider"] = "Google Gemini"
                parsed["language"] = lang
                return parsed
            else:
                print(f"[AI] Gemini API error: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[AI] Gemini call failed: {e}")

    return None

async def get_openai_advice_fallback(evidence: Dict[str, Any], lang: str = "en") -> Optional[Dict[str, Any]]:
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        return None

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    url = "https://api.openai.com/v1/chat/completions"

    lang_instruction = "Respond in English."
    if lang == "sw":
        lang_instruction = "Respond entirely in authentic Kiswahili."
    elif lang == "ek":
        lang_instruction = "Respond in Ekegusii (Kisii) / Kiswahili."

    prompt = f"""Language requirement: {lang_instruction}

Evidence supplied for smallholder farm:
Farm Information: {json.dumps(evidence.get('farm', {}))}
Weather Assessment: {json.dumps(evidence.get('weather', {}))}
Deterministic Risk Results: {json.dumps(evidence.get('risk', {}))}
Satellite Sentinel-2 Data: {json.dumps(evidence.get('satellite', {}))}
Farmer Field Observations: {json.dumps(evidence.get('observations', []))}

Respond ONLY with valid JSON."""

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json=payload
            )
            if resp.status_code == 200:
                res_data = resp.json()
                content = res_data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                parsed["provider"] = "OpenAI (Fallback)"
                parsed["language"] = lang
                return parsed
    except Exception as e:
        print(f"[AI] OpenAI fallback failed: {e}")

    return None

async def generate_advisory(
    farm: Dict[str, Any],
    weather: Dict[str, Any],
    risk: Dict[str, Any],
    satellite: Dict[str, Any],
    observations: List[str],
    lang: str = "en"
) -> Dict[str, Any]:
    evidence = {
        "farm": farm,
        "weather": weather,
        "risk": risk,
        "satellite": satellite,
        "observations": observations
    }

    # 1. Primary: Google Gemini
    advice = await get_gemini_advice(evidence, lang)
    if advice:
        return advice

    # 2. Fallback: OpenAI
    advice = await get_openai_advice_fallback(evidence, lang)
    if advice:
        return advice

    # 3. Fallback: Deterministic Rule-Based
    return generate_rule_based_advice(risk, farm, lang)
