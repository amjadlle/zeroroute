"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export type Column<T> = {
  /** Unique per column. Also the row field used for sorting and the default cell. */
  key: string;
  header: ReactNode;
  cell?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Accessible name of the table. */
  label?: string;
  loading?: boolean;
  /** Shown when there are no rows; usually an EmptyState. */
  empty?: ReactNode;
  /** Makes rows clickable and focusable (Enter or Space activates). */
  onRowClick?: (row: T) => void;
  className?: string;
};

type Sort = { key: string; dir: "ascending" | "descending" };

const ALIGN = { left: "sm:text-left", right: "sm:text-right", center: "sm:text-center" } as const;
const SKELETON_ROWS = 5;

const field = (row: unknown, key: string) => (row as Record<string, unknown>)[key];

function compare(a: unknown, b: unknown) {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1; // empties last
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Table with sortable headers, loading and empty states. Below `sm` each row stacks into a labelled
 * card (CSS only). The header row is hidden there, so sorting is a desktop affordance for now.
 */
export function DataTable<T>({ columns, rows, getRowId, label, loading, empty, onRowClick, className }: DataTableProps<T>) {
  const [sort, setSort] = useState<Sort | null>(null);

  // Client-side sort: fine for a page of rows; sort on the server once tables page through thousands.
  const sorted = sort
    ? [...rows].sort((a, b) => compare(field(a, sort.key), field(b, sort.key)) * (sort.dir === "ascending" ? 1 : -1))
    : rows;

  const toggle = (key: string) =>
    setSort(sort?.key === key && sort.dir === "ascending" ? { key, dir: "descending" } : { key, dir: "ascending" });

  const activate = (row: T) => (e: MouseEvent | KeyboardEvent) => {
    if ("key" in e) {
      if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
    } else if ((e.target as HTMLElement).closest("a, button, input, select, textarea")) {
      return; // a control inside the row handles its own click
    }
    onRowClick?.(row);
  };

  const cells = (row: T | null) =>
    columns.map((col) => (
      <td
        key={col.key}
        className={cn(
          "flex items-center justify-between gap-3 px-3.5 py-1.5 text-right sm:table-cell sm:border-b sm:border-border sm:py-2",
          ALIGN[col.align ?? "left"],
        )}
      >
        {/* Stacked-card label; display:none (so also hidden from screen readers) once the header row shows. */}
        <span className="text-left text-meta text-text-subtle sm:hidden">{col.header}</span>
        {row === null ? (
          <Skeleton className="h-4 w-24 sm:w-full" />
        ) : (
          <span className="min-w-0">{col.cell ? col.cell(row) : String(field(row, col.key) ?? "")}</span>
        )}
      </td>
    ));

  return (
    <div className={cn("min-w-0 overflow-x-auto", className)}>
      <table aria-label={label} aria-busy={loading || undefined} className="block w-full font-ui text-body text-text sm:table sm:border-collapse">
        <thead className="hidden sm:table-header-group">
          <tr>
            {columns.map((col) => {
              const dir = sort?.key === col.key ? sort.dir : undefined;
              const Icon = dir === "ascending" ? ArrowUp : dir === "descending" ? ArrowDown : ArrowUpDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={col.sortable ? (dir ?? "none") : undefined}
                  className={cn(
                    "border-b border-border px-3.5 py-2 text-meta font-medium whitespace-nowrap text-text-muted uppercase",
                    ALIGN[col.align ?? "left"],
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className="-mx-1 inline-flex items-center gap-1 rounded-control px-1 uppercase hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      {col.header}
                      <Icon aria-hidden className={cn("size-3.5", !dir && "text-text-subtle")} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="grid gap-2 sm:table-row-group">
          {loading ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <tr key={i} className="block rounded-card border border-border py-1.5 sm:table-row sm:rounded-none sm:border-0 sm:py-0">
                {cells(null)}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr className="block sm:table-row">
              <td colSpan={columns.length} className="block sm:table-cell">
                {empty ?? <EmptyState title="Nothing here yet" />}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={getRowId(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick && activate(row)}
                onKeyDown={onRowClick && activate(row)}
                className={cn(
                  "block rounded-card border border-border py-1.5 sm:table-row sm:rounded-none sm:border-0 sm:py-0 sm:last:*:border-b-0",
                  onRowClick &&
                    "cursor-pointer hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
                )}
              >
                {cells(row)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
