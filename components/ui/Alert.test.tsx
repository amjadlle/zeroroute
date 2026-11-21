import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("uses role=alert for danger", () => {
    render(<Alert tone="danger" title="Save failed">Try again.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(["info", "success", "warning"] as const)("uses role=status for %s", (tone) => {
    render(<Alert tone={tone} title="Heads up" />);
    expect(screen.getByRole("status")).toHaveTextContent("Heads up");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
