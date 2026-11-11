import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { BevelFace } from '../../bevel-fence.calc';

/** What the diagram draws: the Bevel Angle, the face that was given and the lengths to label. */
export interface BevelDiagramState {
  readonly angleDegrees: number;
  /** The Bevel Angle in the active language's number format, without the degree sign. */
  readonly angle: string;
  readonly givenFace: BevelFace;
  /** The Thickness, already formatted for display. */
  readonly thickness: string;
  /** The Long Face (`x`), already formatted for display. */
  readonly longFace: string;
  /** The Short Face (`y`, the Fence Position), already formatted for display. */
  readonly shortFace: string;
}

/** The words drawn on the diagram, already translated. */
export interface BevelDiagramLabels {
  readonly part: string;
  readonly blade: string;
  readonly fence: string;
  readonly thickness: string;
  readonly rulerZero: string;
  readonly longFace: string;
  readonly shortFace: string;
}

/** Shown in place of a value while there is no valid state yet. */
const NEUTRAL_TEXT = '—';

/** Drawn at this angle while there is no valid state yet. */
const NEUTRAL_ANGLE_DEGREES = 45;

const DEGREES_PER_HALF_TURN = 180;

/** Phone-size screens get a smaller drawing, so its text stays legible when scaled to fit. */
const COMPACT_QUERY = '(max-width: 40rem)';

interface Size {
  /** Thickness of the Part, drawn. */
  readonly thickness: number;
  /** Short Face of the Part, drawn. */
  readonly shortFace: number;
  /** Where the blade meets the table, from the left edge. */
  readonly bladeFoot: number;
  readonly width: number;
}

const FULL: Size = { thickness: 140, shortFace: 260, bladeFoot: 180, width: 640 };
const COMPACT: Size = { thickness: 84, shortFace: 150, bladeFoot: 100, width: 380 };

/** Distances of the drawing that do not depend on its size, in drawing units. */
const LAYOUT = {
  fenceWidth: 14,
  fenceRise: 22,
  tableHeight: 22,
  headroom: 90,
  floor: 92,
  tick: 7,
  pillHeight: 44,
  pillPadding: 28,
  pillRadius: 6,
  nameCharacterWidth: 7.6,
  valueCharacterWidth: 9.8,
  bladeRise: 30,
  bladeInset: 3,
  longDimensionRise: 46,
  shortDimensionDrop: 56,
  extensionGap: 4,
  extensionOvershoot: 9,
  extensionBelowTable: 24,
  thicknessGap: 34,
  thicknessExtension: 40,
  thicknessLabelGap: 14,
  thicknessValueDrop: 17,
  fenceLabelGap: 8,
  fenceLabelRise: 10,
  bladeLabelGap: 12,
  angleLabelGap: 20,
  labelBaseline: 5,
  partLabelShift: 10,
  pillTop: 22,
  nameRise: 5,
  valueDrop: 14,
  rulerZeroGap: 10,
  toothPitch: 12,
  toothDepth: 7,
  minimumToothLength: 0.5,
  roundingScale: 10,
  half: 0.5,
  alternation: 2,
  faceExtensionGap: 2,
};

function round(value: number): number {
  return Math.round(value * LAYOUT.roundingScale) / LAYOUT.roundingScale;
}

function tick(from: number, to: number, y: number): string {
  return `M${round(from)},${y - LAYOUT.tick} V${y + LAYOUT.tick} M${round(to)},${y - LAYOUT.tick} V${y + LAYOUT.tick}`;
}

interface Foot {
  readonly x: number;
  readonly y: number;
}

/** Small triangles on alternating sides of the blade, like the set of a real blade. */
function teeth(foot: Foot, height: number, radians: number): string {
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const { toothPitch, toothDepth } = LAYOUT;
  const onBlade = (s: number): string => `${round(foot.x - s * sin)},${round(foot.y - s * cos)}`;
  const length = height / cos;
  let path = '';
  for (let index = 0, s = 0; s < length - LAYOUT.minimumToothLength; index++, s += toothPitch) {
    const side = index % LAYOUT.alternation === 0 ? 1 : -1;
    const tip = `${round(foot.x - s * sin + side * toothDepth * cos)},${round(foot.y - s * cos - side * toothDepth * sin)}`;
    path += `M${onBlade(s)} L${tip} L${onBlade(Math.min(s + toothPitch, length))} Z `;
  }
  return path;
}

interface DimensionSpec {
  readonly line: number;
  readonly from: number;
  readonly centre: number;
  readonly pill: number;
  readonly value: string;
}

interface DimensionGeometry {
  readonly line: string;
  readonly centre: number;
  readonly pillX: number;
  readonly pillY: number;
  readonly pillWidth: number;
  readonly pillHeight: number;
  readonly pillRadius: number;
  readonly nameY: number;
  readonly valueY: number;
  readonly value: string;
}

function pillWidth(name: string, value: string): number {
  return Math.round(
    Math.max(name.length * LAYOUT.nameCharacterWidth, value.length * LAYOUT.valueCharacterWidth) +
      LAYOUT.pillPadding,
  );
}

/**
 * A front view of the saw: the blade tilted by the Bevel Angle, the Part (its proportions never
 * change, only the blade tilts), the Fence, and the `x` (Long Face) and `y` (Short Face)
 * dimensions with their values. The dimension of the face that was given is highlighted.
 * Without a `state` it draws a neutral blade with no values.
 *
 * `description` is the text alternative, a single sentence that follows the values.
 */
@Component({
  selector: 'wt-bevel-diagram',
  templateUrl: './bevel-diagram.html',
  styleUrl: './bevel-diagram.css',
})
export class BevelDiagram {
  private readonly compact = signal(false);

  readonly state = input<BevelDiagramState>();
  readonly labels = input.required<BevelDiagramLabels>();
  readonly description = input.required<string>();

  constructor() {
    const view = inject(DOCUMENT).defaultView;
    // Some environments (jsdom) have no `matchMedia`: the full-size drawing is used there.
    const query =
      typeof view?.matchMedia === 'function' ? view.matchMedia(COMPACT_QUERY) : undefined;
    if (query !== undefined) {
      this.compact.set(query.matches);
      const onChange = (event: MediaQueryListEvent): void => {
        this.compact.set(event.matches);
      };
      query.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => {
        query.removeEventListener('change', onChange);
      });
    }
  }

  protected readonly geometry = computed(() => {
    const size = this.compact() ? COMPACT : FULL;
    const state = this.state();
    const degrees = state?.angleDegrees ?? NEUTRAL_ANGLE_DEGREES;
    const radians = (degrees * Math.PI) / DEGREES_PER_HALF_TURN;
    const tan = Math.tan(radians);
    const { thickness, shortFace, bladeFoot } = size;
    const { half } = LAYOUT;

    const tableY = thickness + LAYOUT.headroom;
    const faceX = bladeFoot + shortFace;
    const fenceTop = tableY - thickness - LAYOUT.fenceRise;
    const longEdgeX = bladeFoot - thickness * tan;
    const longChosen = (state?.givenFace ?? 'long') === 'long';
    const partTop = tableY - thickness;

    const bladeHeight = thickness + LAYOUT.bladeRise;
    const bladeOffset = bladeFoot - LAYOUT.bladeInset;
    const arcRadius = thickness * half;
    const middle = thickness * half;

    const xLine = partTop - LAYOUT.longDimensionRise;
    const yLine = tableY + LAYOUT.shortDimensionDrop;
    const thicknessX = faceX + LAYOUT.fenceWidth + LAYOUT.thicknessGap;
    const xExtensionEnd = xLine - LAYOUT.extensionOvershoot;
    const yExtensionEnd = yLine + LAYOUT.extensionOvershoot;

    const longValue = state?.longFace ?? NEUTRAL_TEXT;
    const shortValue = state?.shortFace ?? NEUTRAL_TEXT;
    const longPill = pillWidth(`x · ${this.labels().longFace}`, longValue);
    const shortPill = pillWidth(`y · ${this.labels().shortFace}`, shortValue);
    const longCentre = (longEdgeX + faceX) * half;
    const shortCentre = (bladeFoot + faceX) * half;

    const dimension = ({ line, from, centre, pill, value }: DimensionSpec): DimensionGeometry => ({
      line: `M${round(from)},${line} H${faceX} ${tick(from, faceX, line)}`,
      centre: round(centre),
      pillX: round(centre - pill * half),
      pillY: line - LAYOUT.pillTop,
      pillWidth: pill,
      pillHeight: LAYOUT.pillHeight,
      pillRadius: LAYOUT.pillRadius,
      nameY: line - LAYOUT.nameRise,
      valueY: line + LAYOUT.valueDrop,
      value,
    });

    return {
      width: size.width,
      height: tableY + LAYOUT.floor,
      tableY,
      tableHeight: LAYOUT.tableHeight,
      angleText: state === undefined ? NEUTRAL_TEXT : `${state.angle}°`,
      hasAngle: degrees > 0,
      longChosen,
      thicknessText: state?.thickness ?? NEUTRAL_TEXT,
      part: [bladeFoot, tableY, faceX, tableY, faceX, partTop, longEdgeX, partTop]
        .map(round)
        .join(' '),
      partLabel: {
        x: round(bladeFoot + shortFace * half + LAYOUT.partLabelShift),
        y: tableY - middle + LAYOUT.labelBaseline,
      },
      highlight: {
        x1: round(longChosen ? longEdgeX : bladeFoot),
        x2: faceX,
        y: longChosen ? partTop : tableY,
      },
      vertical: `M${bladeFoot},${tableY} V${tableY - bladeHeight}`,
      arc: `M${bladeFoot},${round(tableY - arcRadius)} A${arcRadius},${arcRadius} 0 0 0 ${round(bladeFoot - arcRadius * Math.sin(radians))},${round(tableY - arcRadius * Math.cos(radians))}`,
      angleLabel: { x: bladeFoot - LAYOUT.angleLabelGap, y: tableY - LAYOUT.rulerZeroGap },
      blade: {
        x1: bladeOffset,
        x2: round(bladeOffset - bladeHeight * tan),
        y2: tableY - bladeHeight,
        teeth: teeth({ x: bladeOffset, y: tableY }, bladeHeight, radians),
      },
      bladeLabel: {
        x: round(bladeOffset - middle * tan - LAYOUT.bladeLabelGap),
        y: tableY - middle + LAYOUT.labelBaseline,
      },
      fence: { x: faceX, top: fenceTop, width: LAYOUT.fenceWidth, height: tableY - fenceTop },
      fenceLabel: {
        x: faceX + LAYOUT.fenceWidth + LAYOUT.fenceLabelGap,
        y: partTop - LAYOUT.fenceLabelRise,
      },
      thicknessDimension: `M${thicknessX},${partTop} V${tableY} M${thicknessX - LAYOUT.tick},${partTop} H${thicknessX + LAYOUT.tick} M${thicknessX - LAYOUT.tick},${tableY} H${thicknessX + LAYOUT.tick}`,
      thicknessLabel: {
        x: thicknessX + LAYOUT.thicknessLabelGap,
        name: tableY - middle - LAYOUT.faceExtensionGap,
        value: tableY - middle + LAYOUT.thicknessValueDrop,
      },
      extensionLines: [
        `M${round(longEdgeX)},${partTop - LAYOUT.extensionGap} V${xExtensionEnd}`,
        `M${faceX},${fenceTop - LAYOUT.extensionGap} V${xExtensionEnd}`,
        `M${bladeFoot},${tableY + LAYOUT.extensionBelowTable} V${yExtensionEnd}`,
        `M${faceX},${tableY + LAYOUT.extensionBelowTable} V${yExtensionEnd}`,
        `M${faceX + LAYOUT.fenceWidth + LAYOUT.faceExtensionGap},${partTop} H${faceX + LAYOUT.fenceWidth + LAYOUT.thicknessExtension}`,
      ].join(' '),
      long: dimension({
        line: xLine,
        from: longEdgeX,
        centre: longCentre,
        pill: longPill,
        value: longValue,
      }),
      short: dimension({
        line: yLine,
        from: bladeFoot,
        centre: shortCentre,
        pill: shortPill,
        value: shortValue,
      }),
      rulerZero: { x: bladeFoot - LAYOUT.rulerZeroGap, y: yLine + LAYOUT.labelBaseline },
    };
  });
}
