import { GoogleGenerativeAI } from '@google/generative-ai';
import { marked } from 'marked';

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT =
  'You are BB (BibleBetter), a concise Bible assistant. Use ESV. Include scholarly info and citations. Stay under 300 words.';

export default async function handler(req: Request) {
  try {
    const { prompt, stream } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel(
      { model: 'gemma-3-27b-it', generationConfig: { maxOutputTokens: 800, temperature: 0.7 } },
      { apiVersion: 'v1beta' },
    );

    if (stream) {
      const result = await model.generateContentStream(`${SYSTEM_PROMPT}\n\nUser: ${prompt}`);
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          let cumulativeText = '';
          for await (const chunk of result.stream) {
            cumulativeText += chunk.text();
            const html = await marked.parse(cumulativeText);
            controller.enqueue(encoder.encode(html + '[[SPLIT]]'));
          }
          controller.close();
        },
      });
      return new Response(readable);
    }

    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser: ${prompt}`);
    const html = await marked.parse(result.response.text());
    return new Response(JSON.stringify({ text: html }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
