import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { DEFAULT_BRAND_COLOR } from "@/lib/brand";
import { ChatbotSettingsForm, MAX_SUGGESTED_QUESTIONS, type ChatbotSettings } from "./ChatbotSettingsForm";

const BASE: ChatbotSettings = { bot_title: "Helper", greeting: "Hi!", persona: "", prompts: [], brand_color: "", logo_url: "" };

function setup(initial: Partial<ChatbotSettings> = {}) {
  const onSubmit = vi.fn();
  let current: ChatbotSettings = { ...BASE, ...initial };
  function Harness() {
    const [value, setValue] = useState(current);
    return <ChatbotSettingsForm value={value} onChange={(v) => setValue((current = v))} onSubmit={onSubmit} />;
  }
  render(<Harness />);
  return { onSubmit, value: () => current };
}

it("shows one default colour everywhere when none is saved", () => {
  setup();
  expect(screen.getByRole("radio", { name: "Default" })).toBeChecked();
  expect(screen.getByLabelText("Brand colour")).toHaveAttribute("placeholder", DEFAULT_BRAND_COLOR);
  expect(screen.getByLabelText("Pick any colour")).toHaveValue(DEFAULT_BRAND_COLOR);
});

it("picks a preset, and the default swatch clears the colour", async () => {
  const user = userEvent.setup();
  const form = setup();
  await user.click(screen.getByRole("radio", { name: "Blue" }));
  expect(form.value().brand_color).toBe("#007abe");
  expect(screen.getByRole("radio", { name: "Blue" })).toBeChecked();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: "Purple" })).toHaveFocus();
  await user.click(screen.getByRole("radio", { name: "Default" }));
  expect(form.value().brand_color).toBe("");
});

it("checks no swatch for a custom colour and blocks saving an invalid one", async () => {
  const user = userEvent.setup();
  const form = setup({ brand_color: "#123456" });
  expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  await user.clear(screen.getByLabelText("Brand colour"));
  await user.type(screen.getByLabelText("Brand colour"), "red");
  expect(screen.getByLabelText("Brand colour")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText(/Brand colour must be a hex colour/)).toBeInTheDocument();
  await user.type(screen.getByLabelText("Brand colour"), "{Enter}");
  expect(form.onSubmit).not.toHaveBeenCalled();
});

it("adds, edits and removes suggested questions up to the limit", async () => {
  const user = userEvent.setup();
  const form = setup({ prompts: ["Prices"] });
  await user.click(screen.getByRole("button", { name: "Add question" }));
  expect(screen.getByRole("textbox", { name: "Suggested question 2" })).toHaveFocus();
  await user.keyboard("Refunds");
  expect(form.value().prompts).toEqual(["Prices", "Refunds"]);
  await user.click(screen.getByRole("button", { name: "Remove suggested question 1" }));
  expect(form.value().prompts).toEqual(["Refunds"]);
  for (let i = 1; i < MAX_SUGGESTED_QUESTIONS; i++) await user.click(screen.getByRole("button", { name: "Add question" }));
  expect(screen.queryByRole("button", { name: "Add question" })).toBeNull();
});
