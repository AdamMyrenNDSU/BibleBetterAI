import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  userInput = '';
  gemmaResponse = ''; // Plain string
  loading = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  async sendToGemma(prompt: string) {
    if (!prompt.trim()) return;

    this.loading = true;
    this.gemmaResponse = '';

    // 2. STRICT SYSTEM INSTRUCTION
    // This tells Gemma exactly how to behave before adding the user's question.
    const systemInstruction =
      'You are a concise Bible scholar. Provide the relevant verse(s) and a maximum 2-sentence explanation. Be brief to ensure a fast response. Stay under 150 words.';

    const finalPrompt = `${systemInstruction}\n\nUser Question: ${prompt}`;

    try {
      // Sending the combined prompt to your Vercel /api/chat endpoint
      const res = await firstValueFrom(
        this.http.post<{ text: string }>('/api/chat', { prompt: finalPrompt }),
      );

      // Assign the response text
      this.gemmaResponse = res.text || 'Gemma returned an empty response.';
    } catch (error) {
      console.error('AI Error:', error);
      this.gemmaResponse =
        "Sorry, I couldn't reach Gemma right now. The request might have timed out.";
    } finally {
      this.loading = false;
      // Force Angular to update the UI immediately
      this.cdr.detectChanges();
    }
  }
}
