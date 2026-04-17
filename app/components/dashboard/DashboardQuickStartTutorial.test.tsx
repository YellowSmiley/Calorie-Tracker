import { fireEvent, render, screen } from "@testing-library/react";
import DashboardQuickStartTutorial from "./DashboardQuickStartTutorial";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe("DashboardQuickStartTutorial", () => {
  const storageKey = "dashboard-quick-start-collapsed";

  beforeEach(() => {
    localStorage.clear();
  });

  it("starts visible by default", () => {
    render(<DashboardQuickStartTutorial />);

    expect(screen.getByTestId("dashboard-tutorial-toggle")).toHaveTextContent(
      "Hide tutorial",
    );
    expect(screen.getByTestId("dashboard-tutorial-content")).toBeVisible();
  });

  it("hides and persists the closed state", () => {
    render(<DashboardQuickStartTutorial />);

    fireEvent.click(screen.getByTestId("dashboard-tutorial-toggle"));

    expect(
      screen.queryByTestId("dashboard-tutorial-content"),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(storageKey)).toBe("closed");
  });

  it("includes settings and diary links plus favorites guidance", () => {
    render(<DashboardQuickStartTutorial />);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "href",
      "/diary",
    );
    expect(screen.getByText(/Chicken and Rice/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Favourite/i)).toBeInTheDocument();
  });

  it("respects cached closed state", () => {
    localStorage.setItem(storageKey, "closed");

    render(<DashboardQuickStartTutorial />);

    expect(
      screen.queryByTestId("dashboard-tutorial-content"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard-tutorial-toggle")).toHaveTextContent(
      "Show tutorial",
    );
  });
});
