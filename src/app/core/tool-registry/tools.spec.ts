import en from '../../../../public/i18n/en.json';
import es from '../../../../public/i18n/es.json';
import { translationAt } from '../../../testing/tool-pages';
import type { Lang } from '../i18n/langs';
import { LANGS } from '../i18n/langs';
import { toolRoutes } from './tool-routes';
import { TOOLS } from './tools';

const TRANSLATIONS: Readonly<Record<Lang, unknown>> = { en, es };

describe('the Tool registry', () => {
  // The keys are plain strings, invisible to `pnpm i18n:check`: check them here.
  it("has every Tool's name and description translated in every language", () => {
    const untranslated = TOOLS.flatMap(({ nameKey, descriptionKey }) => [nameKey, descriptionKey])
      .flatMap((key) => LANGS.map((lang) => ({ lang, key })))
      .filter(({ lang, key }) => translationAt(TRANSLATIONS[lang], key) === undefined)
      .map(({ lang, key }) => `${lang}: ${key}`);

    expect(untranslated).toEqual([]);
  });

  it('gives every Tool its own kebab-case route', () => {
    expect(() => toolRoutes(TOOLS)).not.toThrow();
  });
});
