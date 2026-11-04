import type { Translation } from '@jsverse/transloco';
import type { Lang } from '../../app/core/i18n/langs';
import type { ToolEntry } from '../../app/core/tool-registry/tool-entry';
import { TestToolPage } from './test-tool.page';

/**
 * A Tool registry entry that exists only in specs, so shell and home page
 * tests do not depend on which real Tools are registered.
 */
export function testTool(overrides: Partial<ToolEntry> = {}): ToolEntry {
  return {
    path: 'test-tool',
    nameKey: 'tools.testTool.name',
    descriptionKey: 'tools.testTool.description',
    loadRoutes: async () => Promise.resolve([{ path: '', component: TestToolPage }]),
    ...overrides,
  };
}

/** A second test-only Tool, for tests that need more than one. */
export function otherTool(overrides: Partial<ToolEntry> = {}): ToolEntry {
  return testTool({
    path: 'other-tool',
    nameKey: 'tools.otherTool.name',
    descriptionKey: 'tools.otherTool.description',
    ...overrides,
  });
}

/** The test Tools' names and description, merged into the app-wide files by `translocoTesting()`. */
export const TEST_TOOL_TRANSLATIONS: Readonly<Record<Lang, Translation>> = {
  en: {
    tools: {
      testTool: { name: 'Test Tool', description: 'A Tool for tests.' },
      otherTool: { name: 'Other Tool', description: 'Another Tool for tests.' },
    },
  },
  es: {
    tools: {
      testTool: { name: 'Herramienta de prueba', description: 'Una herramienta para pruebas.' },
      otherTool: { name: 'Otra herramienta', description: 'Otra herramienta para pruebas.' },
    },
  },
};
