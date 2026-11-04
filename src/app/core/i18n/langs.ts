/** The languages the UI ships in. English is the source language. */
export const LANGS = ['en', 'es'] as const;

export type Lang = (typeof LANGS)[number];

export const SOURCE_LANG: Lang = 'en';

export function isLang(lang: string): lang is Lang {
  return (LANGS as readonly string[]).includes(lang);
}

/** Each language's name in that language, as language pickers show it. Never translated. */
export const LANG_NAMES: Readonly<Record<Lang, string>> = { en: 'English', es: 'Español' };
