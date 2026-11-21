import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UiProviders } from "@/components/ui/UiProviders";
import { DomainsCard, normalizeDomain } from "./DomainsCard";

it("normalizes typed addresses to the host the gateway matches", () => {
  expect(normalizeDomain(" https://Shop.Example.com:8080/page?x=1 ")).toBe("shop.example.com");
  expect(normalizeDomain("localhost:3000")).toBe("localhost");
  expect(normalizeDomain("*.example.co.uk")).toBe("*.example.co.uk");
  expect(normalizeDomain("192.168.0.10")).toBe("192.168.0.10");
  expect(normalizeDomain("xn--bcher-kva.example")).toBe("xn--bcher-kva.example");
  for (const bad of ["", "abc", "shop", "shop..com", "-shop.com", "shop-.com", "sh op.com", "shop.c0m", "*", "a.b.c.1"]) {
    expect(normalizeDomain(bad), bad).toBeNull();
  }
});

function renderCard(props: Partial<Parameters<typeof DomainsCard>[0]> = {}) {
  const onSave = vi.fn(async () => {});
  render(
    <UiProviders>
      <DomainsCard domains={[]} isPro={false} onSave={onSave} {...props} />
    </UiProviders>,
  );
  return onSave;
}

it("rejects a typo instead of saving it", async () => {
  const onSave = renderCard();
  await userEvent.type(screen.getByLabelText("Website address"), "myshop");
  await userEvent.click(screen.getByRole("button", { name: "Add domain" }));
  expect(screen.getByLabelText("Website address")).toHaveAccessibleDescription(/Enter a website address/);
  expect(onSave).not.toHaveBeenCalled();
});

it("saves the cleaned host and shows the server's error when saving fails", async () => {
  const onSave = renderCard({ isPro: true, domains: ["a.com"] });
  await userEvent.type(screen.getByLabelText("Website address"), "https://B.com/x");
  await userEvent.click(screen.getByRole("button", { name: "Add domain" }));
  expect(onSave).toHaveBeenCalledWith(["a.com", "b.com"]);

  onSave.mockRejectedValueOnce(new Error("Pro accounts can whitelist up to 3 domains."));
  await userEvent.type(screen.getByLabelText("Website address"), "c.com");
  await userEvent.click(screen.getByRole("button", { name: "Add domain" }));
  expect(await screen.findByText(/Couldn't add c.com: Pro accounts/)).toBeInTheDocument();
});

it("asks before removing a domain and keeps the dialog open with the error if removal fails", async () => {
  const onSave = renderCard({ domains: ["a.com"] });
  onSave.mockRejectedValueOnce(new Error("Failed to update allowed domains"));
  await userEvent.click(screen.getByRole("button", { name: "Remove a.com" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("any website");
  await userEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(onSave).toHaveBeenCalledWith([]);
  expect(await screen.findByText("Failed to update allowed domains")).toBeInTheDocument();
});

it("offers Pro instead of the form when a Free customer has used their domain", () => {
  renderCard({ domains: ["a.com"] });
  expect(screen.queryByLabelText("Website address")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Upgrade to Pro/ })).toHaveAttribute("href", "/app/billing");
  expect(screen.getByText("1 of 1")).toBeInTheDocument();
});
