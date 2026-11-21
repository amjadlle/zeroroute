import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";

const paths = (container: HTMLElement) =>
  [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");

describe("Sparkline", () => {
  it("draws a line with one point per value plus an area", () => {
    const { container } = render(<Sparkline values={[1, 5, 3, 8]} label="Requests, last 4 days" />);
    expect(screen.getByRole("img", { name: "Requests, last 4 days" })).toBeInTheDocument();
    const [area, line] = paths(container);
    expect(line.match(/[ML]/g)).toHaveLength(4);
    expect(area.startsWith(line)).toBe(true);
    expect(area.endsWith("Z")).toBe(true);
  });

  it.each([[[7]], [[4, 4, 4]], [[0, 0]]])("has no NaN for %j", (values) => {
    const { container } = render(<Sparkline values={values} />);
    const d = paths(container);
    expect(d).toHaveLength(2);
    d.forEach((p) => expect(p).not.toMatch(/NaN|Infinity/));
  });

  it("renders nothing for no values", () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
