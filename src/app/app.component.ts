import { Component, signal, ChangeDetectorRef } from '@angular/core';
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
  // Use a Signal to force the UI to react to changes
  gemmaResponse = signal<string>('');
  loading = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  async sendToGemma(prompt: string) {
    if (!prompt.trim()) return;

    this.loading = true;
    this.gemmaResponse.set(''); // Clear previous

    try {
      const res = await firstValueFrom(this.http.post<{ text: string }>('/api/chat', { prompt }));

      // Update the signal
      this.gemmaResponse.set(res.text);

      // Manual fallback to tell Angular "hey, something changed!"
      this.cdr.detectChanges();
    } catch (error) {
      this.gemmaResponse.set("Sorry, I couldn't reach Gemma right now.");
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
