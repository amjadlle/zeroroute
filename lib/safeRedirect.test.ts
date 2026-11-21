import { expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirect";

it.each([
  ["/app", "/app"],
  ["/app/usage?range=30d#top", "/app/usage?range=30d#top"],
  ["/admin", "/admin"],
])("keeps same-origin path %s", (raw, expected) => {
  expect(safeRedirectPath(raw)).toBe(expected);
});

it.each([
  null,
  undefined,
  "",
  "app",
  "https://evil.example/app",
  "javascript:alert(1)",
  "//evil.example",
  "/\\evil.example",
  "/\tevil.example",
  "/%0a//evil.example".replace("%0a", "\n"),
  " /app",
])("rejects %j", (raw) => {
  expect(safeRedirectPath(raw)).toBeNull();
});
