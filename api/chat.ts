// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' }, { apiVersion: 'v1beta' });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // MANUAL EXTRACTION: If .text() is empty, we dig into the parts
    let textOutput = '';
    try {
      textOutput = response.text();
    } catch (e) {
      // Fallback: Manually join all text parts from the first candidate
      const parts = response.candidates?.[0]?.content?.parts || [];
      textOutput = parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('');
    }

    if (!textOutput) {
      textOutput =
        'Gemma received the request but returned an empty response. Check safety logs in AI Studio.';
    }

    return new Response(JSON.stringify({ text: textOutput }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
