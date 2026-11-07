# Icons: Lucide through the `wt-icon` component

Every icon in the app comes from Lucide (https://lucide.dev), so the app has one consistent set instead of hand-drawn SVGs. Decided for #75.

## Decision

- **Package, not copied SVG files.** We depend on `@lucide/angular`, which ships each icon as a standalone, tree-shakable component (`<svg lucideArrowRight>`). The icon data is bundled into the app's own JavaScript, so icons add no request to another origin (the self-hosting rule in ADR 0003 holds) and only the icons we import reach the bundle.
- **One design system component, `wt-icon`** (`shared/ui/icon/`), wraps it: `<wt-icon name="arrow-right" size="sm" />`. Templates never use Lucide components directly. Its `IconName` union lists the available icons; to add one, import its component in `icon.ts`, add the name and a `@case` in `icon.html`. This follows ADR 0003: a `wt-` element with scoped styles, `size` reflected on the host.
- **Decorative only.** `wt-icon` always sets `aria-hidden="true"` and is meant to sit next to a visible text label. An icon that must carry meaning alone needs its own issue and an accessible name on the control.
- **Colour through tokens.** The icon strokes with `currentcolor`, so it follows the text colour of its parent (already a token) in both themes. `wt-icon` sets no colour of its own.

## Considered Options

- **Copying SVG files into the repo** (`lucide-static` or the website): no dependency, but each icon needs a loader or inline template and updates are manual.
- **Icon font or sprite from a CDN**: an external request, against ADR 0003.
- **Keeping inline SVGs**: inconsistent drawing and repeated markup.
