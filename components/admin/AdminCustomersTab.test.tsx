import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { UiProviders } from "@/components/ui/UiProviders";
import { buildEmbedSnippet } from "@/lib/embedSnippet";
import { AdminCustomersTab, type CustomerAdminItem } from "./AdminCustomersTab";
import { usageTone } from "./CustomerDetailDrawer";

const customer: CustomerAdminItem = {
  id: "cust_1",
  key: "zr_live_abcdef1234567890",
  email: "ana@example.com",
  company: "Ana's Shop",
  bot_id: "bot_1",
  bot_title: `Ana's "Shop" bot`,
  greeting: "Hi",
  prompts: '["Hours?"]',
  status: "active",
  monthly_requests: 9500,
  monthly_limit: 10000,
  created_at: 0,
};

type Call = { url: string; method: string; body?: unknown };

/** Stubs fetch: `fail` maps a method to an error the server returns. */
function stubFetch(fail: Record<string, string> = {}, json: unknown = { success: true }) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    calls.push({ url, method, body: init.body ? JSON.parse(String(init.body)) : undefined });
    return fail[method] ? Response.json({ error: fail[method] }, { status: 500 }) : Response.json(json);
  }));
  return calls;
}

function setup(customers = [customer]) {
  const onRefresh = vi.fn(async () => {});
  const onViewCustomerLogs = vi.fn();
  render(
    <UiProviders>
      <AdminCustomersTab customers={customers} onRefresh={onRefresh} onViewCustomerLogs={onViewCustomerLogs} />
    </UiProviders>,
  );
  return { onRefresh, onViewCustomerLogs };
}

const manage = () => userEvent.click(screen.getByRole("row", { name: /Ana's Shop/ }));

afterEach(() => vi.unstubAllGlobals());

it("lists customers with initials, plan, usage and status", () => {
  setup();
  const row = screen.getByRole("row", { name: /Ana's Shop/ });
  expect(row).toHaveTextContent("AS");
  expect(row).toHaveTextContent("Pro");
  expect(row).toHaveTextContent("9,500 of 10,000");
  expect(row).toHaveTextContent("Active");
  expect(within(row).getByRole("meter")).toHaveAttribute("aria-valuetext", "9,500 of 10,000");
  expect(screen.getByText("1 customer · 1 on Pro")).toBeInTheDocument();
});

it("counts customers in plain English while searching", async () => {
  setup([customer, { ...customer, id: "cust_2", company: "Bo's Books", email: "bo@example.com", monthly_limit: 500 }]);
  expect(screen.getByText("2 customers · 1 on Pro")).toBeInTheDocument();
  await userEvent.type(screen.getByRole("searchbox", { name: "Search customers" }), "bo@");
  expect(screen.getByText("1 of 2 customers")).toBeInTheDocument();
});

it("acts on a customer from the row without opening the drawer", async () => {
  const calls = stubFetch();
  const { onRefresh, onViewCustomerLogs } = setup();
  await userEvent.click(screen.getByRole("button", { name: "View request log for Ana's Shop" }));
  expect(onViewCustomerLogs).toHaveBeenCalledWith(customer.key);
  await userEvent.click(screen.getByRole("button", { name: "Pause Ana's Shop" }));
  await userEvent.click(within(screen.getByRole("dialog", { name: "Pause Ana's Shop?" })).getByRole("button", { name: "Pause" }));
  expect(calls).toEqual([{ url: "/api/admin/customers", method: "PATCH", body: { id: "cust_1", status: "paused" } }]);
  expect(onRefresh).toHaveBeenCalled();
  expect(screen.queryByRole("dialog", { name: "Ana's Shop" })).toBeNull();
});

it("colours usage by how close the customer is to their limit", () => {
  expect(usageTone(0, 500)).toBe("accent");
  expect(usageTone(84, 100)).toBe("accent");
  expect(usageTone(85, 100)).toBe("warning");
  expect(usageTone(100, 100)).toBe("danger");
  expect(usageTone(5, 0)).toBe("accent");
});

it("opens the drawer with a masked key, the Install page snippet and the logs hand-off", async () => {
  const { onViewCustomerLogs } = setup();
  await manage();
  const drawer = screen.getByRole("dialog", { name: "Ana's Shop" });
  expect(drawer).not.toHaveTextContent(customer.key);
  expect(within(drawer).getByText(/data-bot-id/).textContent).toBe(buildEmbedSnippet({ botId: "bot_1" }));
  expect(drawer).not.toHaveTextContent(/not saved/);
  expect(within(drawer).getByRole("button", { name: "Copy Bot ID" })).toBeInTheDocument();
  await userEvent.click(within(drawer).getByRole("button", { name: "View request log" }));
  expect(onViewCustomerLogs).toHaveBeenCalledWith(customer.key);
});

it("deletes only after confirming", async () => {
  const calls = stubFetch();
  const { onRefresh } = setup();
  await manage();
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(calls).toEqual([]);
  await userEvent.click(screen.getByRole("button", { name: "Delete customer" }));
  expect(calls).toEqual([{ url: "/api/admin/customers?id=cust_1", method: "DELETE", body: undefined }]);
  expect(onRefresh).toHaveBeenCalled();
  expect(await screen.findByText("Customer deleted")).toBeInTheDocument();
});

it("keeps the confirm dialog open with the error when the server refuses", async () => {
  stubFetch({ PATCH: "Failed to update customer" });
  const { onRefresh } = setup();
  await manage();
  await userEvent.click(screen.getByRole("button", { name: "Rotate key" }));
  await userEvent.click(within(screen.getByRole("dialog", { name: /Rotate the API key/ })).getByRole("button", { name: "Rotate key" }));
  expect(await screen.findByText("Failed to update customer")).toBeInTheDocument();
  expect(onRefresh).not.toHaveBeenCalled();
});

it("creates a chatbot and builds the snippet with colour, logo and escaped greeting", async () => {
  const calls = stubFetch({}, { success: true, bot: { bot_id: "bot_new", key: "zr_live_new000000000000" } });
  const { onRefresh } = setup([]);
  await userEvent.click(screen.getByRole("button", { name: "Create chatbot" }));
  const dialog = screen.getByRole("dialog", { name: "Create a chatbot" });
  await userEvent.type(within(dialog).getByLabelText(/Website or project name/), "Blog");
  const greeting = within(dialog).getByLabelText("Greeting");
  await userEvent.clear(greeting);
  await userEvent.type(greeting, 'Say "hi"');
  await userEvent.clear(within(dialog).getByLabelText("Brand colour"));
  await userEvent.type(within(dialog).getByLabelText("Brand colour"), "#2563eb");
  await userEvent.type(within(dialog).getByLabelText("Logo URL"), "https://blog.test/logo.png");
  await userEvent.click(within(dialog).getByRole("button", { name: "Create chatbot" }));

  const result = await screen.findByRole("dialog", { name: "Chatbot created" });
  expect(calls[0]).toMatchObject({ method: "POST", body: { company: "Blog", bot_title: "Blog chatbot", greeting: 'Say "hi"' } });
  expect(result).toHaveTextContent('data-greeting="Say &quot;hi&quot;"');
  expect(result).toHaveTextContent('data-color="#2563eb"');
  expect(result).toHaveTextContent('data-logo="https://blog.test/logo.png"');
  expect(result).not.toHaveTextContent("zr_live_new000000000000");
  expect(onRefresh).toHaveBeenCalled();
});

it("shows a create failure inside the dialog", async () => {
  stubFetch({ POST: "Failed to create bot" });
  setup([]);
  await userEvent.click(screen.getByRole("button", { name: "Create chatbot" }));
  const dialog = screen.getByRole("dialog", { name: "Create a chatbot" });
  await userEvent.type(within(dialog).getByLabelText(/Website or project name/), "Blog");
  await userEvent.click(within(dialog).getByRole("button", { name: "Create chatbot" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to create bot");
});
