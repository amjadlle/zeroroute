import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL("./", import.meta.url)) };

// Two projects: server code runs in node, React components in jsdom.
export default defineConfig({
  resolve: { alias },
  test: {
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "app/**/route.ts", "components/**/*.{ts,tsx}", "proxy.ts"],
      reporter: ["text-summary", "html", "json-summary"],
      // About 5 points under the current numbers (lines 84, statements 84, functions 83, branches 76): raise them as coverage grows.
      thresholds: { lines: 79, statements: 78, functions: 77, branches: 70 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["{lib,app,tests}/**/*.test.ts", "proxy.test.ts"],
          setupFiles: ["tests/setup-node.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["{components,app}/**/*.test.tsx"],
          setupFiles: ["tests/setup-dom.ts"],
        },
      },
    ],
  },
});
