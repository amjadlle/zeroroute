/**
 * Cookie jar behind a mocked `next/headers`. Kept import-free so the mock factory can load it:
 *   vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);
 */
export const jar: { session?: string } = {};
export const nextHeaders = {
  cookies: async () => ({
    get: (name: string) => (name === "zr_session" && jar.session ? { name, value: jar.session } : undefined),
  }),
};
