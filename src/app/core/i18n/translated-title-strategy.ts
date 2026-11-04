import { DestroyRef, inject, Service } from '@angular/core';
import { Title } from '@angular/platform-browser';
import type { RouterStateSnapshot } from '@angular/router';
import { TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, combineLatest } from 'rxjs';

/**
 * Builds the document title from translation keys: a route's `title` is an
 * app-wide translation key (a Tool's route uses the Tool's name key), shown as
 * "<page> – <app name>"; a page without one is titled with the app name alone.
 * The title follows the active language, since it is what screen readers
 * announce on navigation (WCAG 2.4.2).
 */
@Service()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  private readonly transloco = inject(TranslocoService);

  private readonly pageKey = new BehaviorSubject<string | undefined>(undefined);

  constructor() {
    super();
    // Emits once the active language's file is loaded, and again on every switch.
    const subscription = combineLatest([
      this.pageKey,
      this.transloco.selectTranslation(),
    ]).subscribe(([pageKey]) => {
      this.title.setTitle(this.translatedTitle(pageKey));
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.next(this.buildTitle(snapshot));
  }

  private translatedTitle(pageKey: string | undefined): string {
    const appName = this.transloco.translate('app.name');
    if (pageKey === undefined) {
      return appName;
    }
    const page: string = this.transloco.translate(pageKey);
    return this.transloco.translate('app.pageTitle', { page, appName });
  }
}
