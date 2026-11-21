// Shared browser fetch for the admin and user consoles. Auth is the httpOnly
// session cookie only (sent automatically on same-origin requests).

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiInit = Omit<RequestInit, "body"> & {
  /** Plain objects/arrays are JSON-encoded; strings are sent as JSON as-is. */
  body?: BodyInit | object | null;
  /** Called on 401 instead of the default login redirect (tests, custom flows). */
  onUnauthorized?: () => void;
};

export function redirectToLogin() {
  // Full navigation on purpose: this runs outside React (no router) and drops client state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
}

const isPlainJson = (b: unknown): b is object =>
  Array.isArray(b) || (b !== null && typeof b === "object" && Object.getPrototypeOf(b) === Object.prototype);

export async function apiFetch<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  const { body, onUnauthorized = redirectToLogin, ...rest } = init;
  const headers = new Headers(rest.headers);
  const json = typeof body === "string" || isPlainJson(body);
  if (json && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(path, {
    ...rest,
    headers,
    body: isPlainJson(body) ? JSON.stringify(body) : (body as BodyInit | null | undefined),
  });

  const text = await res.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : undefined; } catch { /* non-JSON body: keep text */ }

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    const serverMsg = (data as { error?: unknown } | undefined)?.error;
    throw new ApiError(res.status, typeof serverMsg === "string" && serverMsg ? serverMsg : `Request failed (${res.status})`);
  }
  return data as T;
}
