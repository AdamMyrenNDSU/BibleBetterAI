import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // Required for [(ngModel)] and *ngIf
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  // This name must match the import in main.ts
  userInput = '';
  gemmaResponse = '';
  loading = false;

  constructor(private http: HttpClient) {}

  async sendToGemma(prompt: string) {
    if (!prompt.trim()) return;

    this.loading = true;
    this.gemmaResponse = '';

    try {
      const res = await firstValueFrom(this.http.post<{ text: string }>('/api/chat', { prompt }));
      this.gemmaResponse = res.text;
    } catch (error) {
      this.gemmaResponse = "Sorry, I couldn't reach Gemma right now.";
    } finally {
      this.loading = false;
    }
  }
}
