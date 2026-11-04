import type { Routes } from '@angular/router';
import type { ToolEntry } from './core/tool-registry/tool-entry';
import { toolRoutes } from './core/tool-registry/tool-routes';
import { TOOLS } from './core/tool-registry/tools';

/**
 * The home page, one route per registered Tool, and a not-found page for any
 * other address. Route titles are translation keys (TranslatedTitleStrategy).
 */
export function appRoutes(tools: readonly ToolEntry[]): Routes {
  return [
    { path: '', pathMatch: 'full', loadComponent: async () => import('./home/home.page') },
    ...toolRoutes(tools),
    {
      path: '**',
      title: 'notFound.title',
      loadComponent: async () => import('./not-found/not-found.page'),
    },
  ];
}

export const routes: Routes = appRoutes(TOOLS);
