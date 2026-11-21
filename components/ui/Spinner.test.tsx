import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";
import { PageLoader } from "./PageLoader";

describe("Spinner", () => {
  it("is announced only when it has a label", () => {
    const { container } = render(<Spinner />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("PageLoader announces a loading status", () => {
    render(<PageLoader label="Loading customers" />);
    expect(screen.getByRole("status", { name: "Loading customers" })).toBeInTheDocument();
  });
});
