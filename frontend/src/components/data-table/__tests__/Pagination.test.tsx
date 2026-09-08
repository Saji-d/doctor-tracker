import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total when limit/total aren't provided", () => {
    render(<Pagination page={2} totalPages={5} onChange={jest.fn()} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("shows the item range when limit/total are provided", () => {
    render(<Pagination page={2} totalPages={5} total={45} limit={10} itemLabel="doctors" onChange={jest.fn()} />);
    expect(screen.getByText("Showing 11–20 of 45 doctors")).toBeInTheDocument();
  });

  it("disables Previous page on the first page and Next page on the last page", () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();

    rerender(<Pagination page={3} totalPages={3} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("calls onChange with page-1 / page+1 when the arrow buttons are clicked", () => {
    const onChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("calls onChange with the clicked page number", () => {
    const onChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("marks the current page as active", () => {
    render(<Pagination page={2} totalPages={5} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("shows every page for small page counts, and collapses with an ellipsis for large ones", () => {
    render(<Pagination page={1} totalPages={5} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();

    const onChange = jest.fn();
    render(<Pagination page={1} totalPages={20} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: "Page 10" })).not.toBeInTheDocument();
    expect(screen.getByText("…")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page 20" }));
    expect(onChange).toHaveBeenLastCalledWith(20);
  });
});
