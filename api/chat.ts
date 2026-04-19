import { GoogleGenerativeAI } from '@google/generative-ai';
import { marked } from 'marked';

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT =
  'You are BB (BibleBetter), a concise Bible assistant. Use ESV. Include scholarly info and citations. Stay under 300 words.';

export default async function handler(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel(
      { model: 'gemma-3-27b-it', generationConfig: { maxOutputTokens: 800, temperature: 0.7 } },
      { apiVersion: 'v1beta' },
    );

    const result = await model.generateContentStream(`${SYSTEM_PROMPT}\n\nUser: ${prompt}`);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let cumulativeText = '';
        for await (const chunk of result.stream) {
          cumulativeText += chunk.text();
          // We parse markdown on the server so the client gets clean HTML
          const html = await marked.parse(cumulativeText);
          controller.enqueue(encoder.encode(html + '[[SPLIT]]'));
        }
        controller.close();
      },
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
