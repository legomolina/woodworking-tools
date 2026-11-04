import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

const routes: Routes = [
  {
    path: '',
    providers: [provideTranslocoScope('unit-converter')],
    loadComponent: async () => import('./unit-converter.page'),
  },
];

export default routes;
