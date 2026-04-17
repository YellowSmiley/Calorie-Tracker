import { render, screen, fireEvent } from "@testing-library/react";
import HelpButton from "./HelpButton";

describe("HelpButton", () => {
  const title = "Test Help Title";
  const content = "This is the help content.";
  const ariaLabel = "Help: test help";

  it("renders button with correct title and aria-label", () => {
    render(
      <HelpButton title={title} ariaLabel={ariaLabel}>
        <p>{content}</p>
      </HelpButton>,
    );
    const button = screen.getByRole("button", { name: /help/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", ariaLabel);
  });

  it("shows and hides modal with correct content and title", () => {
    render(
      <HelpButton title={title} ariaLabel={ariaLabel}>
        <p>{content}</p>
      </HelpButton>,
    );
    const button = screen.getByRole("button", { name: /help/i });
    // Modal/dialog should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Open modal
    fireEvent.click(button);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(dialog).toHaveTextContent(title);
    expect(dialog).toHaveTextContent(content);
    // Close modal (assume close button is present)
    const closeButton = screen.getByRole("button", { name: /close|×/i });
    fireEvent.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
