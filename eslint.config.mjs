import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'dist/**', 'coverage/**', 'node_modules/**']),
  {
    rules: {
      // This app intentionally reads localStorage and computes the first countdown
      // value inside effects: doing it during render would make the server HTML and
      // the first client render differ (hydration mismatch). The rule is too strict
      // for that pattern.
      'react-hooks/set-state-in-effect': 'off',
      // Config files conventionally `export default { ... }`
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    // Legacy terminal (Ink) version: JSX here renders terminal text, not HTML.
    files: ['src/cli/**'],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]);
