import en from '../public/i18n/en.json';
import { TOOLS } from '../src/app/core/tool-registry/tools';
import type { AppPage } from '../src/testing/tool-pages';
import { toolPages } from '../src/testing/tool-pages';

/**
 * Every page of the app. Page-level checks (such as accessibility) run against
 * each one. Tool pages come from the Tool registry, so a Tool added to the
 * router is audited automatically; only pages outside it are listed here.
 */
export const appRoutes: readonly AppPage[] = [
  { path: '/', heading: 'Woodworking Tools' },
  { path: '/no-such-page', heading: 'Page not found' },
  ...toolPages(TOOLS, en),
];
