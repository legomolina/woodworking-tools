import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { isLang, LANGUAGE_OPTIONS } from '../../core/i18n/langs';
import { SettingsStore } from '../../core/settings/settings-store';
import { Select } from '../../shared/ui/select/select';

/** The bottom of every page: what the app does with your data, and the language picker. */
@Component({
  selector: 'wt-site-footer',
  imports: [Select, TranslocoPipe],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  private readonly settings = inject(SettingsStore);

  protected readonly languages = LANGUAGE_OPTIONS;

  protected readonly language = this.settings.language;

  protected chooseLanguage(language: string): void {
    if (isLang(language)) {
      this.settings.setLanguage(language);
    }
  }
}
