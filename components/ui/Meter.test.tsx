import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Meter } from "./Meter";

describe("Meter", () => {
  it("exposes role, name and values", () => {
    render(<Meter label="Questions used" value={640} max={1000} valueText="640 of 1,000" />);
    const meter = screen.getByRole("meter", { name: "Questions used" });
    expect(meter).toHaveAttribute("aria-valuenow", "640");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "1000");
    expect(meter).toHaveAttribute("aria-valuetext", "640 of 1,000");
    expect(meter.firstElementChild).toHaveStyle({ width: "64%" });
  });

  it("renders zero usage as zero width", () => {
    render(<Meter label="Usage" value={0} />);
    expect(screen.getByRole("meter").firstElementChild).toHaveStyle({ width: "0%" });
  });

  it("clamps over-limit values and survives max 0", () => {
    const { rerender } = render(<Meter label="Usage" value={150} max={100} />);
    expect(screen.getByRole("meter").firstElementChild).toHaveStyle({ width: "100%" });
    rerender(<Meter label="Usage" value={5} max={0} />);
    expect(screen.getByRole("meter").firstElementChild).toHaveStyle({ width: "0%" });
  });
});
