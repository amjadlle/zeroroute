import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

const items = [
  { value: "html", label: "Any website", content: "HTML snippet" },
  { value: "react", label: "React", content: "React snippet" },
  { value: "api", label: "API", content: "API snippet" },
];

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs", () => {
  it("links the selected tab and its panel", () => {
    render(<Tabs label="Install method" items={items} defaultValue="react" />);
    expect(screen.getByRole("tablist", { name: "Install method" })).toBeInTheDocument();
    const selected = tab("React");
    expect(selected).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("React snippet");
    expect(selected).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", selected.id);
    expect(screen.getByRole("tabpanel", { name: "React" })).toBe(panel);
  });

  it("moves focus and selection with arrow keys, wrapping at both ends", async () => {
    const user = userEvent.setup();
    render(<Tabs label="Install method" items={items} />);
    await user.click(tab("Any website"));
    await user.keyboard("{ArrowRight}");
    expect(tab("React")).toHaveFocus();
    expect(tab("React")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("React snippet");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(tab("Any website")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(tab("API")).toHaveFocus();
    expect(tab("API")).toHaveAttribute("aria-selected", "true");
  });

  it("supports Home and End", async () => {
    const user = userEvent.setup();
    render(<Tabs label="Install method" items={items} defaultValue="react" />);
    await user.click(tab("React"));
    await user.keyboard("{End}");
    expect(tab("API")).toHaveFocus();
    expect(tab("API")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(tab("Any website")).toHaveFocus();
    expect(tab("Any website")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps only the active tab in the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <Tabs label="Install method" items={items} defaultValue="api" />
      </>,
    );
    expect(screen.getAllByRole("tab").map((t) => t.tabIndex)).toEqual([-1, -1, 0]);
    await user.click(screen.getByText("before"));
    await user.tab();
    expect(tab("API")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
  });

  it("in controlled mode calls onValueChange and follows the value prop", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("html");
      return (
        <Tabs
          label="Install method"
          items={items}
          value={value}
          onValueChange={(v) => {
            onValueChange(v);
            setValue(v);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(tab("API"));
    expect(onValueChange).toHaveBeenLastCalledWith("api");
    expect(tab("API")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith("html");
    await user.click(tab("Any website"));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("keeps the selection when a controlling parent ignores the change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs label="Install method" items={items} value="html" onValueChange={onValueChange} />);
    await user.click(tab("React"));
    expect(onValueChange).toHaveBeenCalledWith("react");
    expect(tab("Any website")).toHaveAttribute("aria-selected", "true");
  });
});
