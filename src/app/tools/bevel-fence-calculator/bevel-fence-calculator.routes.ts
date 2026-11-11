import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

const routes: Routes = [
  {
    path: '',
    providers: [provideTranslocoScope('bevel-fence-calculator')],
    loadComponent: async () => import('./bevel-fence-calculator.page'),
  },
];

export default routes;
