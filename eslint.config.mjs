import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Literal colours and arbitrary Tailwind colour / text-size classes, checked in strings and template literals.
const TOKEN_PATTERNS = [
  [String.raw`^#[0-9a-fA-F]{3,8}$|\b(rgba?|hsla?|oklch|oklab)\(`, "Hardcoded colour: use a colour token from app/globals.css."],
  [String.raw`-\[[^\]]*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()`, "Arbitrary colour class: use a colour token (bg-surface, text-text-muted, ...)."],
  [String.raw`\btext-\[[0-9.]+(px|rem|em)\]`, "Arbitrary text size: use a type token (text-meta, text-body, ...)."],
];
const designTokenRules = TOKEN_PATTERNS.flatMap(([re, message]) => [
  // Not styling: an in-page link (href="#cafe") or an example value in a placeholder.
  { selector: `Literal[value=/${re}/]:not(JSXAttribute[name.name=/^(href|placeholder)$/] > Literal)`, message },
  { selector: `TemplateElement[value.raw=/${re}/]`, message },
]);

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
  {
    // Design tokens only (#11): colours and type sizes come from app/globals.css, not literals.
    // User data (a widget brand colour) is fine: mark it with a disable comment that says so.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    // The OG image is rendered outside the CSS, so it needs literal colours.
    ignores: ["**/*.test.{ts,tsx}", "app/**/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...designTokenRules],
    },
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
