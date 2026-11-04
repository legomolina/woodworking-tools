import { InjectionToken } from '@angular/core';
import type { ToolEntry } from './tool-entry';
import { TOOLS } from './tools';

/**
 * The registered Tools, for code that lists them (the home page and the
 * shell's navigation). Specs provide their own entries, such as `testTool()`.
 */
export const TOOL_REGISTRY = new InjectionToken<readonly ToolEntry[]>('TOOL_REGISTRY', {
  providedIn: 'root',
  factory: (): readonly ToolEntry[] => TOOLS,
});
