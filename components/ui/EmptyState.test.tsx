import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title, description and a working action", async () => {
    const onAdd = vi.fn();
    render(
      <EmptyState
        title="No documents yet"
        description="Add a file to teach your chatbot."
        action={<button onClick={onAdd}>Add knowledge</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
    expect(screen.getByText("Add a file to teach your chatbot.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add knowledge" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
