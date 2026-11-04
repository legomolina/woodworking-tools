// Mutation testing for the pure domain logic (`*.calc.ts`). Stryker changes the
// code in small ways (mutants) and re-runs the specs: a mutant the specs do not
// catch shows a behaviour no test pins down. Run with `pnpm mutation`.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: ['src/**/*.calc.ts'],
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.calc.config.mts', related: false },
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
  // Below `break` the run fails. It sits a few points under today's score
  // (94.9% on 2026-11-04), so a new behaviour without tests turns CI red.
  thresholds: { high: 90, low: 80, break: 90 },
};
