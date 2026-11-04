import type { ToolEntry } from '../app/core/tool-registry/tool-entry';

/** A page of the app and the `h1` that proves the right page rendered. */
export interface AppPage {
  readonly path: string;
  readonly heading: string;
}

/**
 * The text a nested translation key (`tools.unitConverter.name`) points at in
 * a translation file, or `undefined` when the key is missing or names a group.
 */
export function translationAt(translations: unknown, key: string): string | undefined {
  let node = translations;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !Object.hasOwn(node, part)) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * The page of every registered Tool, each expected to show the Tool's name
 * (looked up in `translations`) as its one `h1`. Throws when a name is not
 * translated, so the audit cannot silently skip or mis-check a Tool.
 */
export function toolPages(tools: readonly ToolEntry[], translations: unknown): AppPage[] {
  return tools.map(({ path, nameKey }) => {
    const heading = translationAt(translations, nameKey);
    if (heading === undefined) {
      throw new Error(`The Tool at "/${path}" has no translated name at "${nameKey}".`);
    }
    return { path: `/${path}`, heading };
  });
}
