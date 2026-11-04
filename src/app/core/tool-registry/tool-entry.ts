import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

/**
 * How a Tool is declared in the Tool registry (`tools.ts`). Code outside a
 * Tool (the router, the shell, the home page and the settings page)
 * only ever sees this, never the Tool's internals.
 *
 * Keep this module free of runtime imports: the e2e suite imports the registry
 * in Node to audit every Tool's page.
 */
export interface ToolEntry {
  /** The Tool's route without the leading slash, kebab-case and matching its folder: `unit-converter`. */
  readonly path: string;
  /**
   * App-wide translation key (`public/i18n/<lang>.json`) of the Tool's name,
   * such as `tools.unitConverter.name`. The Tool's page shows it as its one `h1`.
   */
  readonly nameKey: string;
  /** App-wide translation key of the Tool's short description: `tools.unitConverter.description`. */
  readonly descriptionKey: string;
  /**
   * Lazily loads the Tool's routes, which `<tool-name>.routes.ts` default-exports:
   * `() => import('../../tools/<tool-name>/<tool-name>.routes')`.
   */
  readonly loadRoutes: () => Promise<Routes | { default: Routes }>;
  /**
   * Lazily loads the Tool's section of the settings page, for Tools that have
   * settings. The page puts it in its own section under the Tool's name (an
   * `h2`), so the component renders only the fields, starting at `h3`.
   */
  readonly loadSettingsSection?: () => Promise<Type<unknown>>;
}
