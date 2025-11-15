import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './shared/components/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly translate = inject(TranslateService);
  protected readonly title = signal('ui');

  ngOnInit(): void {
    // Set default language
    this.translate.setDefaultLang('en');

    // Use browser language if available, otherwise use default
    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang && ['en', 'es'].includes(browserLang) ? browserLang : 'en';
    this.translate.use(lang);
  }
}
