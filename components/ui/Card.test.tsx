import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardBody, CardFooter, CardHeader } from "./Card";

describe("Card", () => {
  it("renders a heading at the chosen level with description, actions, body and footer", () => {
    render(
      <Card aria-label="Usage card">
        <CardHeader as="h3" title="Usage" description="This month" actions={<button>Export</button>} />
        <CardBody>42 requests</CardBody>
        <CardFooter><button>Upgrade</button></CardFooter>
      </Card>,
    );
    expect(screen.getByLabelText("Usage card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Usage" })).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByText("42 requests")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
  });

  it("defaults to h2 and renders no empty description or actions", () => {
    const { container } = render(<CardHeader title="Keys" />);
    expect(screen.getByRole("heading", { level: 2, name: "Keys" })).toBeInTheDocument();
    expect(container.querySelector("p")).toBeNull();
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});
