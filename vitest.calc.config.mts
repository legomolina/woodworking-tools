// Runs only the pure domain specs (`*.calc.spec.ts`: no Angular, no DOM) with
// plain Vitest, so Stryker can re-run them quickly for every mutant. The full
// suite still runs through `ng test`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.calc.spec.ts'],
    globals: true,
    environment: 'node',
  },
});
