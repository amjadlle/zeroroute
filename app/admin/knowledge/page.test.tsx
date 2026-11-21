import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { UiProviders } from "@/components/ui/UiProviders";
import AdminKnowledgePage from "./page";

const customers = [
  { id: "1", key: "zr_a", email: "a@example.com", company: "Alpha", status: "active", monthly_requests: 0, monthly_limit: 500, created_at: 0 },
  { id: "2", key: "zr_b", email: "b@example.com", company: "Beta", status: "active", monthly_requests: 0, monthly_limit: 500, created_at: 0 },
];
const doc = (id: string, title: string) => ({ id, title, type: "manual_text", content: "", char_count: 1, created_at: 0 });

afterEach(() => vi.unstubAllGlobals());

it("loads the first customer's knowledge first, and a slow reply for a previous customer never shows", async () => {
  let releaseAlpha!: () => void;
  const urls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    urls.push(url);
    if (url === "/api/admin/customers") return Response.json({ customers });
    if (url.endsWith("target_key=zr_a")) {
      await new Promise<void>((r) => { releaseAlpha = r; });
      return Response.json({ documents: [doc("a1", "Alpha prices")] });
    }
    return Response.json({ documents: [doc("b1", "Beta hours")] });
  }));

  render(<UiProviders><AdminKnowledgePage /></UiProviders>);
  await userEvent.selectOptions(await screen.findByLabelText("Customer"), "zr_b");
  expect(await screen.findByText("Beta hours")).toBeInTheDocument();

  releaseAlpha();
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.queryByText("Alpha prices")).toBeNull();
  expect(urls.filter((u) => u.startsWith("/api/knowledge"))).toEqual(["/api/knowledge?target_key=zr_a", "/api/knowledge?target_key=zr_b"]);
});
