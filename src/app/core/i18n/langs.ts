/** The languages the UI ships in. English is the source language. */
export const LANGS = ['en', 'es'] as const;

export type Lang = (typeof LANGS)[number];

export const SOURCE_LANG: Lang = 'en';
