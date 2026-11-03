// Stylelint plugin: `@import` may only load local files. Built-in URL rules
// (function-url-*) do not look inside `@import` params, so an import such as
// `@import url('https://fonts.googleapis.com/…')` would otherwise pass.

import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages },
} = stylelint;

const ruleName = 'local/no-external-import';
const messages = ruleMessages(ruleName, {
  rejected: (url) =>
    `Unexpected external @import "${url}". Self-host the file and import it by a relative path.`,
});

/** A URL with a scheme (`https:`, `data:`…) or protocol-relative (`//host`). */
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** The URL an @import's params load, in either `url(…)` or string form. */
function importedUrl(params) {
  const match = /^\s*(?:url\(\s*)?(['"]?)(.*?)\1\s*\)?(?:\s|;|$)/i.exec(params);
  return match ? match[2] : params;
}

const rule = (enabled) => (root, result) => {
  if (!enabled) {
    return;
  }
  root.walkAtRules(/^import$/i, (atRule) => {
    const url = importedUrl(atRule.params);
    if (EXTERNAL.test(url)) {
      report({ result, ruleName, node: atRule, message: messages.rejected(url) });
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export default createPlugin(ruleName, rule);
