import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { prompt, stream } = await req.json();

    // Access the API key
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key is missing on Vercel' }), {
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // FIX: Remove 'models/' prefix when using the apiVersion setting
    const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' }, { apiVersion: 'v1beta' });

    // STREAMING MODE
    if (stream) {
      const result = await model.generateContentStream(prompt);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                controller.enqueue(encoder.encode(chunkText));
              }
            }
          } catch (e) {
            console.error('Stream error:', e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // NON-STREAM MODE
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Handler Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
