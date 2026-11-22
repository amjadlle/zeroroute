import { ESLint } from "eslint";
import { expect, it } from "vitest";

// Runs the real eslint.config.mjs, so this breaks if the #11 design-token rule stops matching.
const eslint = new ESLint();
const tokenErrors = async (code: string, filePath = "components/Sample.tsx") => {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-syntax").length;
};

it("flags hardcoded colours and arbitrary colour / text-size classes", async () => {
  for (const code of [
    `export const a = "#1a2b3c";`,
    `export const a = "rgba(0, 0, 0, 0.5)";`,
    `export const a = "oklch(0.7 0.1 20)";`,
    `export const a = <p className="bg-[#fff] p-2" />;`,
    `export const a = <p className="shadow-[0_0_4px_rgba(0,0,0,.2)]" />;`,
    `export const a = <p className="text-[13px]" />;`,
    "export const a = `border-[#123456] ${1}`;",
  ]) {
    expect(await tokenErrors(code), code).toBeGreaterThan(0);
  }
}, 60_000);

it("allows tokens, layout arbitrary values, links, placeholders, tests and the OG image", async () => {
  for (const code of [
    `export const a = <p className="bg-landing-bg text-meta h-[36rem] max-w-[85%]" />;`,
    `export const a = <a href="#cafe">FAQ</a>;`,
    `export const a = <input placeholder="#4f46e5" />;`,
    `export const a = "Use a hex colour like #2563eb.";`,
  ]) {
    expect(await tokenErrors(code), code).toBe(0);
  }
  expect(await tokenErrors(`export const a = "#ffffff";`, "app/opengraph-image.tsx")).toBe(0);
  expect(await tokenErrors(`export const a = "#ffffff";`, "components/Sample.test.tsx")).toBe(0);
}, 60_000);
