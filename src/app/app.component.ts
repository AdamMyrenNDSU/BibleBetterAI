import {
  Component,
  signal,
  OnInit,
  ViewChildren,
  ElementRef,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChildren('messageRow') messageRows!: QueryList<ElementRef>;

  messages = signal<{ role: string; text: string }[]>([]);
  userInput = '';
  isTyping = false; // This fixes the TS2339 error

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initialGreeting();
  }

  private scrollToLastUserMessage() {
    setTimeout(() => {
      const userMessages = this.messageRows
        .toArray()
        .filter((el) => el.nativeElement.classList.contains('user'));
      if (userMessages.length > 0) {
        userMessages[userMessages.length - 1].nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }

  async initialGreeting() {
    this.isTyping = true;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Initial Greeting', // This value doesn't matter now
          isGreeting: true, // CRITICAL: This triggers the list in chat.ts
        }),
      });

      const data = await response.json();
      this.messages.update((prev) => [...prev, { role: 'ai', text: data.text }]);
    } catch (e) {
      console.error(e);
    } finally {
      this.isTyping = false;
      this.cdr.detectChanges();
    }
  }

  async send() {
    // This fixes the TS2339: Property 'send' error
    if (!this.userInput.trim() || this.isTyping) return;

    const userText = this.userInput;
    this.userInput = '';
    this.messages.update((prev) => [
      ...prev,
      { role: 'user', text: userText },
      { role: 'ai', text: '' },
    ]);
    this.isTyping = true;
    this.scrollToLastUserMessage();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt: userText, stream: true }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const parts = chunk.split('[[SPLIT]]').filter((p) => p.length > 0);
        if (parts.length > 0) {
          this.messages.update((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'ai', text: parts[parts.length - 1] };
            return next;
          });
          this.cdr.detectChanges();
        }
      }
    } catch (e) {
      this.messages.update((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'ai', text: 'Error reaching AI.' };
        return next;
      });
    } finally {
      this.isTyping = false;
      this.cdr.detectChanges();
    }
  }
}
