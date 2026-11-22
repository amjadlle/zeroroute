import { render, screen } from "@testing-library/react";
import { KeyRound } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders a heading with a decorative icon, description and actions", () => {
    const { container } = render(
      <SectionHeader icon={KeyRound} as="h3" title="API keys" description="Rotate often." actions={<button>New key</button>} />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "API keys" })).toBeInTheDocument();
    expect(screen.getByText("Rotate often.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New key" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to h2 with no icon, description or actions", () => {
    const { container } = render(<SectionHeader title="Domains" />);
    expect(screen.getByRole("heading", { level: 2, name: "Domains" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });
});
