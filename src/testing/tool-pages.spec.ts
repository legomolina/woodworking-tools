import type { ToolEntry } from '../app/core/tool-registry/tool-entry';
import { toolPages } from './tool-pages';

function testEntry(path: string, toolName: string): ToolEntry {
  return {
    path,
    nameKey: `tools.${toolName}.name`,
    descriptionKey: `tools.${toolName}.description`,
    loadRoutes: async () => Promise.resolve([]),
  };
}

const translations = {
  tools: {
    testTool: { name: 'Test Tool', description: 'A Tool for tests.' },
    otherTool: { name: 'Other Tool', description: 'Another Tool for tests.' },
  },
};

describe('toolPages', () => {
  it("lists every registered Tool's page with its name as the expected h1", () => {
    const tools = [testEntry('test-tool', 'testTool'), testEntry('other-tool', 'otherTool')];

    expect(toolPages(tools, translations)).toEqual([
      { path: '/test-tool', heading: 'Test Tool' },
      { path: '/other-tool', heading: 'Other Tool' },
    ]);
  });

  it('fails when a Tool name has no translation, rather than auditing against a raw key', () => {
    const tools = [testEntry('missing-tool', 'missingTool')];

    expect(() => toolPages(tools, translations)).toThrow(/tools\.missingTool\.name/);
  });

  it('fails when the name key points at a group of translations instead of a text', () => {
    const tools = [{ ...testEntry('test-tool', 'testTool'), nameKey: 'tools.testTool' }];

    expect(() => toolPages(tools, translations)).toThrow(/tools\.testTool/);
  });
});
