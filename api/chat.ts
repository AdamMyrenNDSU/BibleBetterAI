// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { prompt } = await req.json();

  // Use globalThis to safely access the Vercel environment variable
  const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'] || '';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'models/gemma-3-27b-it' });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return new Response(JSON.stringify({ text: response.text() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'AI Communication Error' }), { status: 500 });
  }
}
