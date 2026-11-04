import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { isLang, LANG_NAMES, LANGS } from '../../core/i18n/langs';
import { SettingsStore } from '../../core/settings/settings-store';
import type { SelectOption } from '../../shared/ui/select/select';
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

  /** Each language named in itself, so a reader finds theirs whatever the page's language. */
  protected readonly languages: readonly SelectOption[] = LANGS.map((lang) => ({
    value: lang,
    label: LANG_NAMES[lang],
    lang,
  }));

  protected readonly language = this.settings.language;

  protected chooseLanguage(language: string): void {
    if (isLang(language)) {
      this.settings.setLanguage(language);
    }
  }
}
