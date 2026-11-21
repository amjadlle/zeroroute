import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ApiQuickstart } from "./ApiQuickstart";
import { PlatformGuides } from "./PlatformGuides";
import { SnippetCard } from "./SnippetCard";

it("shows the embed snippet for the customer's Bot ID", () => {
  const { container } = render(<SnippetCard botId="bot_abc" />);
  expect(container.querySelector("code")).toHaveTextContent(/<script src=".*\/widget\.js" data-bot-id="bot_abc" defer> <\/script>/);
});

it("switches platform guides and shows the Next.js code", async () => {
  render(<PlatformGuides botId="bot_abc" />);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Paste the embed snippet just before the closing </body> tag.");
  await userEvent.click(screen.getByRole("tab", { name: "Next.js" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent(`<Script src="https://`);
  expect(screen.getByRole("tabpanel")).toHaveTextContent(`data-bot-id="bot_abc" strategy="lazyOnload" />`);
  expect(screen.getByRole("tabpanel")).not.toHaveTextContent(/defer|<\/script>/);
});

it("keeps the API key masked and out of the code examples", () => {
  const { container } = render(<ApiQuickstart apiKey="zr_live_secret1234" />);
  expect(container).not.toHaveTextContent("zr_live_secret");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("$ZEROROUTE_API_KEY");
});
