import type { Routes } from '@angular/router';
import { toolRoutes } from './core/tool-registry/tool-routes';
import { TOOLS } from './core/tool-registry/tools';

export const routes: Routes = toolRoutes(TOOLS);
