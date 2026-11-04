import { initialLang } from './initial-lang';

describe('initialLang', () => {
  it.each(['es-ES', 'es-MX', 'es'])('picks Spanish for the %s browser language', (browserLang) => {
    expect(initialLang(browserLang)).toBe('es');
  });

  it.each(['en-US', 'fr-FR', 'en'])('picks English for the %s browser language', (browserLang) => {
    expect(initialLang(browserLang)).toBe('en');
  });

  it('picks English when the browser reports no language', () => {
    expect(initialLang(undefined)).toBe('en');
  });
});
