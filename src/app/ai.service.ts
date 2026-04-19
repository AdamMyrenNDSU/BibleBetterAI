import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  // We import CommonModule for *ngIf and FormsModule for [(ngModel)]
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  userInput = '';
  gemmaResponse = '';
  loading = false;

  constructor(private http: HttpClient) {}

  async sendToGemma(prompt: string) {
    if (!prompt.trim()) return;

    this.loading = true;
    this.gemmaResponse = ''; // Clear previous response

    try {
      // We call your Vercel /api/chat endpoint
      const res = await firstValueFrom(this.http.post<{ text: string }>('/api/chat', { prompt }));

      this.gemmaResponse = res.text;
    } catch (error) {
      console.error('AI Error:', error);
      this.gemmaResponse = "Sorry, I couldn't reach the Bible assistant right now.";
    } finally {
      this.loading = false;
    }
  }
}
