import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, Column } from "../DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: Column<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
];

const rows: Row[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

describe("DataTable", () => {
  it("renders rows using each column's render function", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows skeleton placeholder rows while loading, not the real rows", () => {
    const { container } = render(
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} isLoading skeletonRows={3} />
    );
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    // Skeleton rows render as empty <td> cells with a placeholder div — assert
    // by row count rather than by any specific skeleton class name.
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("shows the empty state when there are no rows and not loading/erroring", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("shows a custom empty state node when provided", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyState={<p>Nothing to see here</p>}
      />
    );
    expect(screen.getByText("Nothing to see here")).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry button, and calls onRetry when clicked", () => {
    const onRetry = jest.fn();
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        isError
        errorMessage="Could not reach server"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText("Could not reach server")).toBeInTheDocument();
    // The error branch replaces the table entirely — rows must not render.
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
