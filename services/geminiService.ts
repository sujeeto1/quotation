import { GoogleGenAI, Type } from "@google/genai";
import { ItineraryItem, GeminiItineraryRequest } from "../types.ts";

export const generateItinerary = async (
  request: GeminiItineraryRequest
): Promise<Partial<ItineraryItem>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Create a detailed day-by-day travel itinerary for a trip to ${request.destination} for ${request.durationDays} days.
    Travelers: ${request.travelers}.
    Budget Style: ${request.budgetLevel}.
    Interests: ${request.interests}.
    
    Provide a list of suggested items.
    For each item, specify the day number (1 for first day, 2 for second, etc.).
    Include generic flight placeholder for Day 1.
    Include hotel check-ins.
    Include specific activities for each day.
    Do NOT include prices.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['flight', 'hotel', 'activity', 'transfer', 'other'] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  day: { type: Type.INTEGER },
                  time: { type: Type.STRING, description: "e.g. '14:00' or leave empty" }
                },
                required: ['type', 'title', 'description', 'day']
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsed = JSON.parse(jsonText);
    return parsed.items || [];
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
};