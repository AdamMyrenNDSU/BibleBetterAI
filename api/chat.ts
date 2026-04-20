import { GoogleGenerativeAI } from '@google/generative-ai';
import { marked } from 'marked';

export const config = { runtime: 'edge' };

//Great prompt for Gemma 3 27b
/*
const SYSTEM_PROMPT =
  "You are BB (BibleBetter), my personal assistant. You know I'm interested in the Bible." +
  'You should be concise, very accurate, and include many connections with other Bible verses and passages. Keep stricktly to Christianity and christian ideologys, and dont talk about yourself.' +
  'Weeve in scholarly information from modern day and early church.' +
  'Use ESV translation for bible translation. Double check to make sure all verses quoted are correct.' +
  'Dive deep into the topics, and dont talk about the date or by who you were trained. Also, keep responces to 500 words or less (about 350 unless they ask for long answer).' +
  'When giving quotes, please give citations.';
*/
//AI Generated system prompt

/*
const SYSTEM_PROMPT =
  'You are BB (BibleBetter), a highly accurate Bible scholar. ' +
  'Instructions: Dive deep into the topics and biblical texts. Weeve in scholarly info modern day and the early church when helpful. ' +
  'Keep responses strictly to Christian theology, and dont talk about yourself or who/when you were tranied by. Include many connections to other Bible verses.' +
  'Stay under 350 words. Your max ticket output is 600 so dont go over. Use a mix of bullets and paragraphs. Provide citations for all quotes, but dont include Bible version. ';
*/

const SYSTEM_PROMPT =
  "You are BB (BibleBetter), my personal assistant. You know I'm interested in the Bible." +
  'You should be concise, include many connections with other Bible verses and passages. Keep stricktly to Christianity and christian ideologys, and dont talk about yourself.' +
  'Weeve in scholarly information from modern day and early church.' +
  'Use ESV translation for bible translation.' +
  'Dive deep into the topics, and dont talk about the date or by who you were trained. Also, keep responces to 500 words or less (about 100-300 unless they ask for long answer).' +
  'When giving quotes, please give citations.';

// Specific prompt to force a tiny greeting
const GREETINGS = [
  'What scripture is on your mind?',
  'Ready to dive into the Word?',
  'How can I help your study?',
  'Which book are we exploring?',
  'What verse shall we discuss?',
  'Seeking wisdom from a specific passage?',
  'Want to explore a biblical theme?',
  'Need a cross-reference for a verse?',
  'Need a quotes by a specific theologian?',
];

export default async function handler(req: Request) {
  try {
    const { prompt, stream, isGreeting } = await req.json();

    // IF GREETING: Return a random string immediately without calling Google
    if (isGreeting) {
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      return new Response(JSON.stringify({ text: randomGreeting }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // AI LOGIC (Only runs for user questions)
    const apiKey = (globalThis as any).process?.env?.['GOOGLE_API_KEY'];
    if (!apiKey) throw new Error('Missing API Key');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      {
        model: 'gemma-3-27b-it',
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        },
      },
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
    console.error('API Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
