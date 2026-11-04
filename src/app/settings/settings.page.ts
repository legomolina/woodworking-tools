import { NgComponentOutlet } from '@angular/common';
import type { Type } from '@angular/core';
import { Component, computed, inject, resource } from '@angular/core';
import { TranslocoPipe, translateSignal } from '@jsverse/transloco';
import { isLang, LANGUAGE_OPTIONS } from '../core/i18n/langs';
import { SettingsStore } from '../core/settings/settings-store';
import type { ToolEntry } from '../core/tool-registry/tool-entry';
import { TOOL_REGISTRY } from '../core/tool-registry/tool-registry';
import { IMPERIAL_PRECISIONS } from '../shared/measurement/show-length.calc';
import type { UnitSystem } from '../shared/measurement/unit-system';
import type { SegmentedOption } from '../shared/ui/segmented-control/segmented-control';
import { SegmentedControl } from '../shared/ui/segmented-control/segmented-control';
import type { SelectOption } from '../shared/ui/select/select';
import { SelectField } from '../shared/ui/select-field/select-field';

/** A Tool's settings section, once loaded. */
interface ToolSection {
  readonly tool: ToolEntry;
  readonly component: Type<unknown>;
}

/**
 * The sections of the Tools that have settings, in registry order, loaded when
 * the page opens. A section that fails to load is left out rather than
 * taking the others (and the general settings) down with it.
 */
async function loadToolSections(tools: readonly ToolEntry[]): Promise<ToolSection[]> {
  const loaded = await Promise.allSettled(
    tools.map(async (tool) =>
      tool.loadSettingsSection === undefined
        ? undefined
        : { tool, component: await tool.loadSettingsSection() },
    ),
  );
  return loaded.flatMap((result) =>
    result.status === 'fulfilled' && result.value !== undefined ? [result.value] : [],
  );
}

/** The settings page: the app-wide settings, then a section per Tool that has its own. */
@Component({
  selector: 'wt-settings-page',
  imports: [NgComponentOutlet, SegmentedControl, SelectField, TranslocoPipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
})
export default class SettingsPage {
  private readonly settings = inject(SettingsStore);

  private readonly tools = inject(TOOL_REGISTRY);

  private readonly metric = translateSignal('settings.unitSystem.metric');

  private readonly imperial = translateSignal('settings.unitSystem.imperial');

  private readonly inch = translateSignal('settings.imperialPrecision.inch');

  protected readonly unitSystems = computed<readonly SegmentedOption<UnitSystem>[]>(() => [
    { value: 'metric', label: this.metric() },
    { value: 'imperial', label: this.imperial() },
  ]);

  protected readonly unitSystem = this.settings.unitSystem;

  /** Each precision as the smallest fraction it shows: `1/16 in`. */
  protected readonly precisions = computed<readonly SelectOption[]>(() =>
    IMPERIAL_PRECISIONS.map((denominator) => ({
      value: String(denominator),
      label: `1/${denominator} ${this.inch()}`,
    })),
  );

  protected readonly imperialPrecision = computed(() => String(this.settings.imperialPrecision()));

  protected readonly languages = LANGUAGE_OPTIONS;

  protected readonly language = this.settings.language;

  /** Loaded once, when the page opens: a language switch keeps them, and what was typed in them. */
  protected readonly toolSections = resource({
    loader: async () => loadToolSections(this.tools),
    defaultValue: [],
  });

  protected chooseUnitSystem(unitSystem: UnitSystem): void {
    this.settings.setUnitSystem(unitSystem);
  }

  protected chooseImperialPrecision(precision: string): void {
    const denominator = IMPERIAL_PRECISIONS.find((candidate) => String(candidate) === precision);
    if (denominator !== undefined) {
      this.settings.setImperialPrecision(denominator);
    }
  }

  protected chooseLanguage(language: string): void {
    if (isLang(language)) {
      this.settings.setLanguage(language);
    }
  }
}
