import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchParamValue } from "./useSearchParamValue";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace }),
  usePathname: () => "/logs",
}));

describe("useSearchParamValue", () => {
  beforeEach(() => {
    replace.mockClear();
    search = "q=x";
  });

  it("reads the param, falling back when absent", () => {
    expect(renderHook(() => useSearchParamValue("status", "all")).result.current[0]).toBe("all");
    search = "status=failed";
    expect(renderHook(() => useSearchParamValue("status", "all")).result.current[0]).toBe("failed");
  });

  it("writes with replace, keeps other params and drops the param for the fallback", () => {
    const { result } = renderHook(() => useSearchParamValue("status", "all"));
    act(() => result.current[1]("failed"));
    expect(replace).toHaveBeenLastCalledWith("/logs?q=x&status=failed", { scroll: false });
    search = "status=failed";
    const second = renderHook(() => useSearchParamValue("status", "all"));
    act(() => second.result.current[1]("all"));
    expect(replace).toHaveBeenLastCalledWith("/logs", { scroll: false });
  });
});
