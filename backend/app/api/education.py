from typing import List, Optional
from fastapi import APIRouter, Query

router = APIRouter(prefix="/education", tags=["Farmer Education Library"])

EDUCATION_CATALOG = {
    "LUMPY_SKIN_DISEASE": {
        "disease_code": "LUMPY_SKIN_DISEASE",
        "icon": "shield-virus",
        "translations": {
            "en": {
                "title": "Lumpy Skin Disease (LSD)",
                "summary": "A viral disease spread by biting flies and mosquitoes causing nodular lumps on animal skin.",
                "transmission": "Biting insects (flies, mosquitoes, ticks), shared saliva, infected needles.",
                "visual_cues": ["Hard, round lumps on skin (1-5 cm)", "Watering eyes and runny nose", "Swollen legs and milk drop"],
                "dos": [
                    "Isolate infected animals immediately.",
                    "Spray herbal neem or approved fly-repellents in the barn.",
                    "Provide fresh clean water mixed with electrolytes (jaggery and salt)."
                ],
                "donts": [
                    "Do not puncture or squeeze skin lumps.",
                    "Do not sell or move affected animals to weekly cattle markets.",
                    "Do not allow common grazing with neighbor herds."
                ],
                "audio_script": "Lumpy skin disease spreads through flies. Isolate your cow, clean open sores with mild neem water, and do not prick the lumps. A veterinary visit is needed."
            },
            "hi": {
                "title": "लम्पी त्वचा रोग (LSD)",
                "summary": "मक्खी और मच्छरों द्वारा फैलने वाली एक विषाणुजनित बीमारी जिससे मवेशियों की त्वचा पर गांठें बन जाती हैं।",
                "transmission": "काटने वाले कीड़े (मक्खियां, मच्छर, चिचड़ी), दूषित चारा और लार।",
                "visual_cues": ["त्वचा पर गोल और सख्त गांठें (1-5 सेमी)", "आंखों और नाक से पानी बहना", "पैरों में सूजन और दूध में अचानक कमी"],
                "dos": [
                    "संक्रमित पशु को तुरंत स्वस्थ पशुओं से अलग बांधें।",
                    "गौशाला में नीम का धुआं करें और मक्खियों को भगाएं।",
                    "पशु को हल्का हरा चारा और गुड़-नमक का घोल पिलाएं।"
                ],
                "donts": [
                    "त्वचा की गांठों को कभी न फोड़ें या दबाएं।",
                    "बीमार पशु को हाट या बाजार में न ले जाएं।",
                    "संक्रमित पशु का दूध बछड़े को न पिलाएं बिना उबाले।"
                ],
                "audio_script": "लम्पी रोग मक्खियों से फैलता है। बीमार गाय को तुरंत अलग रखें, घावों पर नीम का काढ़ा लगाएं और डॉक्टर को बुलाएं।"
            },
            "ta": {
                "title": "தோல் கழலை நோய் (Lumpy Skin)",
                "summary": "கொசு மற்றும் ஈக்களால் பரவும் வைரஸ் நோய். மாடுகளின் தோலில் வட்ட வடிவ கட்டிகள் தோன்றும்.",
                "transmission": "கொசு, ஈக்கள், உண்ணிகள் மற்றும் அசுத்தமான தீவனம் மூலம் பரவுகிறது.",
                "visual_cues": ["தோலில் வட்டமான கட்டிகள்", "கண், மூக்கிலிருந்து நீர் வடிதல்", "கால்களில் வீக்கம், பால் குறைதல்"],
                "dos": [
                    "பாதிக்கப்பட்ட மாட்டை உடனடியாக தனிமைப்படுத்துங்கள்.",
                    "மாட்டுக்கொட்டகையில் வேப்பிலை புகை போட்டு ஈக்களை விரட்டுங்கள்.",
                    "சுத்தமான குடிநீரில் வெல்லம் மற்றும் உப்பு கலந்து கொடுங்கள்."
                ],
                "donts": [
                    "தோல் கட்டிகளை கிள்ளவோ உடைக்கவோ கூடாது.",
                    "நோய்வாய்ப்பட்ட மாடுகளை சந்தைக்கு கொண்டு செல்ல வேண்டாம்."
                ],
                "audio_script": "தோல் கழலை நோய் ஈக்கள் மூலம் பரவும். பாதிக்கப்பட்ட மாட்டை உடனே தனியாக கட்டி கால்நடை மருத்துவரை அணுகவும்."
            }
        }
    },
    "FOOT_AND_MOUTH_DISEASE": {
        "disease_code": "FOOT_AND_MOUTH_DISEASE",
        "icon": "alert-triangle",
        "translations": {
            "en": {
                "title": "Foot and Mouth Disease (FMD / Khurpaka-Munhpaka)",
                "summary": "Highly contagious viral disease causing painful blisters in mouth and between hooves.",
                "transmission": "Direct contact, airborne in cool weather, shared troughs, vehicles.",
                "visual_cues": ["Stringy drooling saliva from mouth", "Blisters inside lips and tongue", "Severe limping or unable to stand"],
                "dos": [
                    "Place a foot-dip with 2% washing soda at the barn entrance.",
                    "Wash mouth blisters gently with mild soda water.",
                    "Feed soft rice gruel or boiled finger millet."
                ],
                "donts": [
                    "Never walk the animal on hard or paved roads.",
                    "Do not feed hard dry straw or rough grass."
                ],
                "audio_script": "FMD causes painful mouth ulcers and limping. Wash feet in soda water, feed soft cool gruel, and alert the village vet officer right away."
            },
            "hi": {
                "title": "खुरपका-मुंहपका रोग (FMD)",
                "summary": "अत्यधिक संक्रामक विषाणु रोग जिससे मुंह और खुरों के बीच दर्दनाक छाले हो जाते हैं।",
                "transmission": "संक्रमित पशु के सीधे संपर्क, हवा, साझा दाना-पानी से।",
                "visual_cues": ["मुंह से गाढ़ी लार टपकना", "जीभ और मसूड़ों पर छाले", "लंगड़ा कर चलना या खड़े न हो पाना"],
                "dos": [
                    "गौशाला के प्रवेश द्वार पर कपड़े धोने के सोडे का घोल रखें।",
                    "मुंह के छालों को फिटकरी या सोडे के हल्के पानी से साफ करें।",
                    "नरम दलिया या मांड में थोड़ा छाछ मिलाकर खिलाएं।"
                ],
                "donts": [
                    "बीमार पशु को पक्की सड़क या कंकड़ पर न चलाएं।",
                    "सूखा और कड़ा भूसा बिल्कुल न दें।"
                ],
                "audio_script": "खुरपका मुंहपका से मुंह में छाले पड़ते हैं और पशु लंगड़ाता है। पोटाश या सोडे के पानी से खुर धोएं और तुरंत पशु चिकित्सक को दिखाएं।"
            },
            "ta": {
                "title": "கோமாரி நோய் (FMD)",
                "summary": "வாய் மற்றும் குளம்புகளில் கொப்புளங்களை உண்டாக்கும் தீவிர தொற்று நோய்.",
                "transmission": "காற்று, அசுத்தமான தீவனம் மற்றும் நேரடி தொடர்பு மூலம் வேகமாக பரவுகிறது.",
                "visual_cues": ["வாயிலிருந்து நுரை கலந்த உமிழ்நீர் வடிதல்", "குளம்புகளுக்கு நடுவே புண்கள்", "நொண்டி நடப்பது"],
                "dos": [
                    "கொட்டகை வாசலில் சோடா கலந்த நீர் நிரப்பிய தொட்டி வையுங்கள்.",
                    "வாய்ப் புண்களுக்கு படிகார நீர் அல்லது கஞ்சி கொடுங்கள்."
                ],
                "donts": [
                    "கடினமான தீவனம் தர வேண்டாம்.",
                    "மாடுகளை வெளியே மேய்ச்சலுக்கு அனுப்ப வேண்டாம்."
                ],
                "audio_script": "கோமாரி நோய் வாயிலும் காலிலும் புண்களை உண்டாக்கும். மென்மையான உணவு கொடுத்து உடனே மருத்துவரை அழைக்கவும்."
            }
        }
    }
}

@router.get("/library")
def get_education_library(
    language: str = Query("hi", description="Preferred language: en, hi, ta"),
    disease_code: Optional[str] = Query(None)
):
    lang = language.lower() if language in ["en", "hi", "ta"] else "en"
    articles = []

    for code, item in EDUCATION_CATALOG.items():
        if disease_code and code != disease_code:
            continue
        trans = item["translations"].get(lang, item["translations"]["en"])
        articles.append({
            "disease_code": code,
            "icon": item["icon"],
            "language": lang,
            "title": trans["title"],
            "summary": trans["summary"],
            "transmission": trans["transmission"],
            "visual_cues": trans["visual_cues"],
            "dos": trans["dos"],
            "donts": trans["donts"],
            "audio_script": trans["audio_script"]
        })

    return {"language": lang, "count": len(articles), "articles": articles}
