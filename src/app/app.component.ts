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
  isTyping = false;

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
        body: JSON.stringify({ prompt: 'Give a 3-5 word welcome question about the Bible.' }),
      });
      const text = await response.text();
      // Remove the split marker if it exists in non-streamed initial greeting
      const cleanText =
        text
          .split('[[SPLIT]]')
          .reverse()
          .find((t) => t.length > 0) || text;
      this.messages.update((prev) => [...prev, { role: 'ai', text: cleanText }]);
    } finally {
      this.isTyping = false;
      this.cdr.detectChanges();
    }
  }

  async send() {
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
        body: JSON.stringify({ prompt: userText }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Get the latest full markdown-to-html transformation from the stream
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
    } finally {
      this.isTyping = false;
      this.cdr.detectChanges();
    }
  }
}
