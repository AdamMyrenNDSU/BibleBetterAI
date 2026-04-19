// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];

    const genAI = new GoogleGenerativeAI(apiKey);

    // Explicitly set apiVersion to 'v1beta'
    const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' }, { apiVersion: 'v1beta' });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return new Response(JSON.stringify({ text: response.text() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Gemma API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
