// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    // Using v1beta is crucial for Gemma 3 models in many SDK versions
    const model = genAI.getGenerativeModel(
      { model: 'models/gemma-3-27b-it' },
      { apiVersion: 'v1beta' },
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // 1. Check if the response was blocked by safety filters
    if (!response.candidates || response.candidates.length === 0) {
      return new Response(JSON.stringify({ text: 'Response was blocked by safety filters.' }), {
        status: 200,
      });
    }

    const candidate = response.candidates[0];

    // 2. Check for specific finish reasons
    if (candidate.finishReason === 'SAFETY') {
      return new Response(
        JSON.stringify({ text: "I'm sorry, I cannot answer that due to safety guidelines." }),
        { status: 200 },
      );
    }

    // 3. Safely extract text
    const text = response.text();
    return new Response(JSON.stringify({ text: text || 'Gemma produced an empty response.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Gemma API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
