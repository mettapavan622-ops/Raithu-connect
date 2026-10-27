import { GoogleGenAI, Type } from '@google/genai';
import type { ListingDraftResult } from '../shared/types.ts';

export async function generateListingDraft(
  input: string,
  farmerLocality?: string
): Promise<ListingDraftResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server. AI assistance is currently unavailable.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Calculate current date in Asia/Kolkata
  const now = new Date();
  const kolkataDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // e.g. "2026-10-27"

  const systemInstruction = `
You are the RaithuConnect Farmer Listing Assistant for farmers in Hyderabad and Telangana, India.
Farmers speak or write in Telugu (script or transliterated), Hindi (script or Romanized), or English.
Current reference date in Asia/Kolkata timezone is: ${kolkataDateStr}.

Strict Rules:
1. Extract produce details into structured fields.
2. Resolve relative dates like "today", "tomorrow" ("repu" in Telugu, "kal" in Hindi), "yesterday" ("ninna" / "kal"), "this Sunday", etc., strictly relative to ${kolkataDateStr} in YYYY-MM-DD format.
3. NEVER guess or invent any missing information.
   - If price is not mentioned, DO NOT GUESS. Leave pricePerUnit as null and add "Price per unit" to missingFields.
   - If quantity or stock is not mentioned, DO NOT GUESS. Leave quantity as null and add "Available quantity" to missingFields.
   - If harvest date is not mentioned, DO NOT GUESS. Leave harvestDate as null and add "Harvest date" to missingFields.
   - If pickup locality is not mentioned and not provided as context, DO NOT GUESS. Leave pickupLocality as null and add "Pickup locality" to missingFields. If farmerLocality is provided as context ("${farmerLocality || ''}"), you may use that as default locality if none specified.
4. If there are uncertainties (e.g., "around 30 to 40 kg", "might be ready Friday or Saturday"), note them in uncertainties.
5. Unit must be one of: "kg", "bunch", "piece".
   - If unit is "kg", quantity must be in grams (e.g. 50 kg -> 50000 grams).
   - If unit is "bunch" or "piece", quantity must be a whole integer.
6. Category must be one of: "vegetables", "fruits", "leafy_greens", "grains", "spices_and_others".
7. Never invent certifications, organic stamps, or food safety guarantees.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `Farmer input: "${input}". Existing farmer locality context: "${farmerLocality || 'None'}".`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING, description: 'Produce name in English (e.g., "Fresh Country Tomatoes (Naatu Tomato)")' },
          category: {
            type: Type.STRING,
            enum: ['vegetables', 'fruits', 'leafy_greens', 'grains', 'spices_and_others'],
            description: 'Produce category'
          },
          unit: {
            type: Type.STRING,
            enum: ['kg', 'bunch', 'piece'],
            description: 'Measurement unit'
          },
          quantity: {
            type: Type.INTEGER,
            description: 'Quantity in grams for kg, or whole units for bunch/piece. Null if unknown.'
          },
          pricePerUnit: {
            type: Type.NUMBER,
            description: 'Price in INR rupees per unit. Null if unknown.'
          },
          harvestDate: {
            type: Type.STRING,
            description: 'ISO date YYYY-MM-DD in Asia/Kolkata. Null if unknown.'
          },
          availabilityDate: {
            type: Type.STRING,
            description: 'ISO date YYYY-MM-DD ready for pickup. Null if unknown.'
          },
          pickupLocality: {
            type: Type.STRING,
            description: 'Pickup village, mandal, or locality in Hyderabad/Telangana. Null if unknown.'
          },
          description: {
            type: Type.STRING,
            description: 'Short helpful description based solely on what the farmer stated.'
          },
          isSurplus: { type: Type.BOOLEAN, description: 'Whether the farmer mentioned excess or surplus harvest' },
          surplusDiscountPct: { type: Type.INTEGER, description: 'Discount percentage if stated, else 0' },
          missingFields: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of essential fields that the farmer needs to fill in manually'
          },
          uncertainties: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Ambiguities or ranges noted in the farmer speech'
          },
          notes: {
            type: Type.STRING,
            description: 'Brief guidance or summary for the farmer'
          }
        },
        required: ['missingFields', 'uncertainties', 'notes'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Empty response from AI assistant');
  }

  const parsed = JSON.parse(text);
  return {
    productName: parsed.productName || null,
    category: parsed.category || null,
    unit: parsed.unit || null,
    quantity: parsed.quantity || null,
    pricePerUnit: parsed.pricePerUnit || null,
    harvestDate: parsed.harvestDate || null,
    availabilityDate: parsed.availabilityDate || null,
    pickupLocality: parsed.pickupLocality || farmerLocality || null,
    description: parsed.description || null,
    isSurplus: Boolean(parsed.isSurplus),
    surplusDiscountPct: parsed.surplusDiscountPct || 0,
    missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
    uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
    notes: parsed.notes || '',
  };
}
