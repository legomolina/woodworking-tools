import type { Lang } from './langs';

/**
 * The language the app starts in, from the browser's preferred language
 * (`es-MX`, `en`…): Spanish for any Spanish variant, English otherwise.
 */
export function initialLang(browserLang: string | undefined): Lang {
  return browserLang?.toLowerCase().startsWith('es') ? 'es' : 'en';
}
