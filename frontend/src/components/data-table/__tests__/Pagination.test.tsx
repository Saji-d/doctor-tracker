import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total", () => {
    render(<Pagination page={2} totalPages={5} onChange={jest.fn()} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    rerender(<Pagination page={3} totalPages={3} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("calls onChange with page-1 / page+1 when Previous/Next are clicked", () => {
    const onChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});
