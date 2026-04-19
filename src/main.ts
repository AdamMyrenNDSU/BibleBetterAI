import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component'; // Ensure name and path match

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // Essential for the AIService to work
  ],
}).catch((err) => console.error(err));
