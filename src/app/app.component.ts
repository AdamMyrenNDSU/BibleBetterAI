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

    try {
      const res = await firstValueFrom(this.http.post<{ text: string }>('/api/chat', { prompt }));

      // Assign the response text
      this.gemmaResponse = res.text || 'Gemma returned an empty response.';
    } catch (error) {
      console.error('AI Error:', error);
      this.gemmaResponse = "Sorry, I couldn't reach Gemma right now.";
    } finally {
      this.loading = false;
      // Force Angular to update the UI immediately
      this.cdr.detectChanges();
    }
  }
}
