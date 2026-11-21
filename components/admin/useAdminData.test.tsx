import { afterEach, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminData } from "./useAdminData";

afterEach(() => vi.unstubAllGlobals());

it("ignores a slow older reply that lands after a newer one", async () => {
  let failFirst!: () => void;
  const fetch = vi
    .fn()
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { failFirst = () => resolve(Response.json({ error: "boom" }, { status: 500 })); }))
    .mockImplementationOnce(async () => Response.json({ n: 2 }));
  vi.stubGlobal("fetch", fetch);

  const { result } = renderHook(() => useAdminData<{ n: number }>("/api/admin/x"));
  await act(() => result.current.reload());
  expect(result.current.data).toEqual({ n: 2 });

  await act(async () => failFirst());
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(result.current.error).toBeUndefined();
  expect(result.current.data).toEqual({ n: 2 });
});

it("keeps old data and reports the error when a reload fails", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(Response.json({ n: 1 }))
    .mockResolvedValueOnce(Response.json({ error: "Database is down" }, { status: 500 })));

  const { result } = renderHook(() => useAdminData<{ n: number }>("/api/admin/x"));
  await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
  await act(() => result.current.reload());
  expect(result.current).toMatchObject({ data: { n: 1 }, error: "Database is down", loading: false });
});
