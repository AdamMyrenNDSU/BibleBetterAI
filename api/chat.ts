import { GoogleGenerativeAI } from '@google/generative-ai';
import { marked } from 'marked';

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT =
  "You are BB (BibleBetter), my personal assistant. You know I'm interested in the Bible." +
  'You should be concise, include many connections with other Bible verses and passages. Keep stricktly to Christianity and christian ideologys, and dont talk about yourself.' +
  'Weeve in scholarly information from modern day and early church.' +
  'Use ESV translation for bible translation.' +
  'Dive deep into the topics, and dont talk about the date or by who you were trained. Also, keep responces to 500 words or less (about 100-300 unless they ask for long answer).' +
  'When giving quotes, please give citations.';
// Specific prompt to force a tiny greeting
const GREETING_PROMPT =
  'You are BB. Give a 3-5 word welcome question about the Bible. No preamble.';

export default async function handler(req: Request) {
  try {
    // We add 'isGreeting' to the incoming request body
    const { prompt, stream, isGreeting } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel(
      {
        model: 'gemma-3-27b-it',
        generationConfig: {
          // If it's a greeting, limit to 20 tokens for speed. Otherwise 800.
          maxOutputTokens: isGreeting ? 20 : 800,
          temperature: 0.7,
        },
      },
      { apiVersion: 'v1beta' },
    );

    // Choose the instruction based on whether it is the first load
    const activeSystemPrompt = isGreeting ? GREETING_PROMPT : SYSTEM_PROMPT;

    if (stream) {
      const result = await model.generateContentStream(`${activeSystemPrompt}\n\nUser: ${prompt}`);
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

    const result = await model.generateContent(`${activeSystemPrompt}\n\nUser: ${prompt}`);
    const html = await marked.parse(result.response.text());
    return new Response(JSON.stringify({ text: html }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
