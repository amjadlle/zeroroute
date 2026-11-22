import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its text and passes attributes through", () => {
    render(<Badge tone="success" title="Live since May">Live</Badge>);
    expect(screen.getByTitle("Live since May")).toHaveTextContent("Live");
  });

  it("shows a decorative dot with dot or pulse, none by default", () => {
    const { container } = render(
      <>
        <Badge>Plain</Badge>
        <Badge dot tone="warning">Dot</Badge>
        <Badge pulse tone="info">Pulse</Badge>
      </>,
    );
    const [plain, dot, pulse] = Array.from(container.children);
    expect(plain.querySelector("[aria-hidden]")).toBeNull();
    expect(dot.querySelector("[aria-hidden='true']")?.children).toHaveLength(1);
    expect(pulse.querySelector("[aria-hidden='true']")?.children).toHaveLength(2);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
