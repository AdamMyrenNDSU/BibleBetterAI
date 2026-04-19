// src/app/ai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AIService {
  constructor(private http: HttpClient) {}

  async askGemma(userPrompt: string) {
    // Call your internal Vercel API endpoint
    return this.http.post<{ text: string }>('/api/chat', { prompt: userPrompt }).toPromise();
  }
}
