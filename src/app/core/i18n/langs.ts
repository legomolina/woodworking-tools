/** The languages the UI ships in. English is the source language. */
export const LANGS = ['en', 'es'] as const;

export type Lang = (typeof LANGS)[number];

export const SOURCE_LANG: Lang = 'en';

export function isLang(lang: string): lang is Lang {
  return (LANGS as readonly string[]).includes(lang);
}

/** Each language's name in that language, as language pickers show it. Never translated. */
export const LANG_NAMES: Readonly<Record<Lang, string>> = { en: 'English', es: 'Español' };

/**
 * Each language as a language picker offers it: named in itself and marked
 * with its own `lang`, so a reader finds theirs whatever the page's language.
 */
export const LANGUAGE_OPTIONS: readonly { value: Lang; label: string; lang: Lang }[] = LANGS.map(
  (lang) => ({ value: lang, label: LANG_NAMES[lang], lang }),
);
