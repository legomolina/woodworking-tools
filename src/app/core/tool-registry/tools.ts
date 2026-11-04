import type { ToolEntry } from './tool-entry';

/**
 * The Tool registry: the one place a Tool is declared. The router, the home
 * page, the shell's navigation, the settings page (through `TOOL_REGISTRY`)
 * and the e2e accessibility audit read it, so adding a
 * Tool means adding its entry here (plus its `tools.<toolName>.*` name and
 * description in the app-wide translation files) and nothing else.
 *
 * ```ts
 * {
 *   path: 'unit-converter',
 *   nameKey: 'tools.unitConverter.name',
 *   descriptionKey: 'tools.unitConverter.description',
 *   loadRoutes: () => import('../../tools/unit-converter/unit-converter.routes'),
 * }
 * ```
 */
export const TOOLS: readonly ToolEntry[] = [];
