import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatTile } from "./StatTile";

describe("StatTile", () => {
  it("renders label, value, delta and hint", () => {
    render(<StatTile label="Requests" value="48,210" delta="+6%" hint="last 7 days" trend={[1, 3, 2]} />);
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByText("48,210")).toBeInTheDocument();
    expect(screen.getByText("+6%")).toBeInTheDocument();
    expect(screen.getByText("last 7 days")).toBeInTheDocument();
  });

  it("points the arrow the way the value moved, coloured by whether that is good", () => {
    render(<StatTile label="Reply" value="1.1 s" delta="−0.2 s" deltaTone="positive" deltaDirection="down" />);
    const delta = screen.getByText("−0.2 s");
    expect(delta).toHaveClass("text-success-fg");
    expect(delta.querySelector("svg")).toHaveClass("lucide-trending-down");
  });
});
