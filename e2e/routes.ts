/** A page of the app and the `h1` that proves the right page rendered. */
export interface AppRoute {
  readonly path: string;
  readonly heading: string;
}

/**
 * Every page of the app. Page-level checks (such as accessibility) run against
 * each one, so adding a Tool means adding its route here.
 */
export const appRoutes: readonly AppRoute[] = [{ path: '/', heading: 'Woodworking Tools' }];
