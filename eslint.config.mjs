import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // A leading underscore marks an argument kept for the call signature.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // ES5 script embedded on customer sites: `catch (e)` is required there (no optional catch binding).
    files: ["public/widget.js"],
    rules: { "@typescript-eslint/no-unused-vars": ["warn", { caughtErrors: "none" }] },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // vitest --coverage output.
    "coverage/**",
  ]),
]);

export default eslintConfig;
