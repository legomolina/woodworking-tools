/** @type {import("stylelint").Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-clean-order',
    'stylelint-plugin-logical-css/configs/recommended',
  ],
  plugins: ['stylelint-plugin-logical-css'],
};
