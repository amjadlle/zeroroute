import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./api";

const mockFetch = (body: string, status = 200) => {
  const fn = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(body, { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("returns parsed JSON and JSON-encodes object bodies", async () => {
    const fetchFn = mockFetch(JSON.stringify({ ok: true }));
    await expect(apiFetch("/api/x", { method: "POST", body: { a: 1 } })).resolves.toEqual({ ok: true });
    const [, init] = fetchFn.mock.calls[0];
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("throws ApiError with the server's error message", async () => {
    mockFetch(JSON.stringify({ error: "Domain not allowed" }), 400);
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ name: "ApiError", status: 400, message: "Domain not allowed" });
  });

  it("falls back to a status message on a non-JSON error body", async () => {
    mockFetch("<html>Bad Gateway</html>", 502);
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 502, message: "Request failed (502)" });
  });

  it("clears the session cookie, then redirects to /login with the current path on 401", async () => {
    const fetchFn = mockFetch(JSON.stringify({ error: "Unauthorized" }), 401);
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/admin", assign } });
    await expect(apiFetch("/api/admin/providers")).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith("/login?redirect=%2Fadmin"));
    expect(fetchFn.mock.calls[1]).toEqual(["/api/auth/logout", { method: "POST" }]);
  });

  it("uses an injected onUnauthorized handler instead of redirecting", async () => {
    mockFetch("", 401);
    const onUnauthorized = vi.fn();
    await expect(apiFetch("/api/x", { onUnauthorized })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("passes the AbortSignal through and rejects when aborted", async () => {
    const fetchFn = vi.fn((_: string, init: RequestInit) =>
      new Promise<Response>((_res, rej) =>
        init.signal!.addEventListener("abort", () => rej(new DOMException("Aborted", "AbortError")))));
    vi.stubGlobal("fetch", fetchFn);
    const ctrl = new AbortController();
    const p = apiFetch("/api/x", { signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchFn.mock.calls[0][1].signal).toBe(ctrl.signal);
  });
});
