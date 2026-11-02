# Runtime i18n with Transloco

The UI ships in English and Spanish from the start: English is the source language and every key is translated into Spanish as it is added. We chose runtime translation with Transloco over Angular's built-in `@angular/localize` (one build per locale, page reload to switch) so there is a single build and a single preview deployment per PR, and the language can be switched in-app. We picked Transloco over ngx-translate for its route-scoped lazy loading (one scope per tool) and its official keys manager. The keys manager's missing-translation check runs both as a validation step for the agent and as a CI step.

## Considered Options

- **`@angular/localize`**: compile-time, fastest at runtime, but one build per locale and no in-app switch.
- **ngx-translate 18**: familiar and modernised with signals, but no built-in scoped lazy loading and key extraction relies on third-party tooling.
