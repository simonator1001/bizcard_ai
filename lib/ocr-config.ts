// OpenRouter API — unified LLM gateway (DeepSeek + Qwen VL)
// Qwen VL Plus: best cost/quality for business card OCR in HK
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
export const VISION_MODEL = 'qwen/qwen-vl-plus';
export const FALLBACK_VISION_MODEL = 'claude-sonnet-4.5'; // Deepbrick fallback

// OCR prompt template for business card extraction
export const OCR_PROMPT = `You are a business card information extractor specializing in bilingual (English and Chinese) business cards. Your task is to:

1. Carefully examine the image for both English and Chinese text
2. Pay special attention to Chinese characters (汉字) anywhere on the card
3. Extract ALL text in both languages where available
4. For each field, if Chinese text exists, it MUST be captured
5. Look for text in both vertical and horizontal orientations
6. Check for text in all colors (black, purple, etc.)

Example of a properly extracted business card:
{
  "name": {
    "english": "Christina Tang",
    "chinese": "鄧潔瑩"
  },
  "title": {
    "english": "Deputy Director, Marketing & Communications",
    "chinese": "副總監 市務及傳訊部"
  },
  "company": {
    "english": "Tai Hing Group",
    "chinese": "太興環球發展有限公司"
  },
  "email": "christina.tang@taihing.com",
  "phone": "D: 3710 9802, M: 9288 3752",
  "address": {
    "english": "13/F, Chinachem Exchange Square, 1 Hoi Wan Street, Quarry Bay, Hong Kong",
    "chinese": "香港鴨脷洲海灣街1號華懋交易廣場13樓"
  }
}

Extract and return ONLY a JSON object with this exact structure. For the business card shown:

1. Name (姓名):
   - Look for Chinese characters that appear to be a person's name
   - Often appears in larger text or near the top
   - May be in both English and Chinese

2. Title (職位):
   - Look for job positions in both languages
   - May include department names
   - Can be on multiple lines

3. Company (公司):
   - Look for the company name in both languages
   - May include legal entity type (Ltd., 有限公司)
   - Could be in larger text or logo form

4. Contact Details:
   - Email: Look for @ symbol
   - Phone: Look for multiple numbers (direct line, mobile, fax)
   - Format numbers with any prefixes (D:, M:, F:)

5. Address (地址):
   - Extract complete address in both languages
   - Include building name, floor, street, district
   - Preserve all location details

Important:
- NEVER leave Chinese text empty if it exists on the card
- Do not translate between languages - only extract what is actually on the card
- Keep all numbers and special characters in contact information
- Maintain original formatting of phone numbers
- Return ONLY the JSON object, no additional text or explanations`;
