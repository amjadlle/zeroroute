import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

type Row = { id: string; name: string; latency: number };
const rows: Row[] = [
  { id: "a", name: "Beta", latency: 900 },
  { id: "b", name: "Alpha", latency: 80 },
  { id: "c", name: "Gamma", latency: 300 },
];
const columns: Column<Row>[] = [
  { key: "name", header: "Customer", sortable: true },
  { key: "latency", header: "Latency", align: "right", sortable: true, cell: (r) => `${r.latency} ms` },
];

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row");
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("DataTable", () => {
  it("sorts on header click and updates aria-sort", async () => {
    render(<DataTable label="Requests" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    const header = screen.getByRole("columnheader", { name: /Latency/ });
    expect(header).toHaveAttribute("aria-sort", "none");

    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(firstCells()).toEqual(["CustomerAlpha", "CustomerGamma", "CustomerBeta"]);

    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(firstCells()).toEqual(["CustomerBeta", "CustomerGamma", "CustomerAlpha"]);
    expect(screen.getByRole("columnheader", { name: /Customer/ })).toHaveAttribute("aria-sort", "none");
  });

  it("shows the empty state when there are no rows", () => {
    render(<DataTable columns={columns} rows={[]} getRowId={(r) => r.id} empty={<p>No requests yet</p>} />);
    expect(screen.getByText("No requests yet")).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    render(<DataTable label="Requests" columns={columns} rows={rows} getRowId={(r) => r.id} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(bodyRows()).toHaveLength(5);
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("activates a row with Enter", async () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    await userEvent.tab(); // first sortable header button
    await userEvent.tab();
    await userEvent.tab(); // first row
    expect(bodyRows()[0]).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("activates a row with Space or a click, but not from a control inside it", async () => {
    const onRowClick = vi.fn();
    const withAction: Column<Row>[] = [...columns, { key: "act", header: "Action", cell: () => <button>Retry</button> }];
    render(<DataTable columns={withAction} rows={rows} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    bodyRows()[1].focus();
    await userEvent.keyboard(" ");
    expect(onRowClick).toHaveBeenLastCalledWith(rows[1]);
    await userEvent.click(within(bodyRows()[2]).getByText("Gamma"));
    expect(onRowClick).toHaveBeenLastCalledWith(rows[2]);
    await userEvent.click(within(bodyRows()[0]).getByRole("button", { name: "Retry" }));
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it("rows are not focusable without onRowClick, and the default empty state shows", () => {
    const { unmount } = render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(bodyRows()[0]).not.toHaveAttribute("tabindex");
    unmount();
    render(<DataTable columns={columns} rows={[]} getRowId={(r) => r.id} />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("sorts empty values last", async () => {
    type Opt = { id: string; name?: string };
    const data: Opt[] = [{ id: "1" }, { id: "2", name: "b" }, { id: "3" }, { id: "4", name: "a" }];
    render(<DataTable columns={[{ key: "name", header: "Name", sortable: true }]} rows={data} getRowId={(r) => r.id} />);
    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(firstCells()).toEqual(["Namea", "Nameb", "Name", "Name"]);
  });
});
