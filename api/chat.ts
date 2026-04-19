// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { prompt, stream } = await req.json();
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    const genAI = new GoogleGenerativeAI(apiKey);

    // Using v1beta is crucial for Gemma 3 models in many SDK versions
    const model = genAI.getGenerativeModel(
      { model: 'models/gemma-3-27b-it' },
      { apiVersion: 'v1beta' },
    );

    /*const model = genAI.getGenerativeModel({
      model: 'gemma-3-27b-it',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });*/

    // STREAMING MODE
    if (stream) {
      const result = await model.generateContentStream(prompt);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // NON-STREAM MODE
    const result = await model.generateContent(prompt);
    return Response.json({ text: result.response.text() });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
