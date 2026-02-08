import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import * as nextAuth from "next-auth/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page title and description", () => {
    render(<LoginPage />);

    expect(screen.getByText("Calorie Tracker")).toBeInTheDocument();
    expect(
      screen.getByText("Track your daily food intake and macronutrients"),
    ).toBeInTheDocument();
  });

  it("renders the sign-in prompt text", () => {
    render(<LoginPage />);

    expect(
      screen.getByText("Sign in to access your diary"),
    ).toBeInTheDocument();
  });

  it("renders the Google sign-in button", () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("calls signIn with correct parameters when button is clicked", async () => {
    const mockSignIn = jest.fn();
    (nextAuth.signIn as jest.Mock).mockImplementation(mockSignIn);

    render(<LoginPage />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/diary",
      });
    });
  });

  it("shows loading state while signing in", async () => {
    // Mock signIn to be a slow promise
    (nextAuth.signIn as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<LoginPage />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });

    fireEvent.click(button);

    // The button should show loading state
    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it("renders terms of service notice", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/By signing in, you agree to our Terms of Service/i),
    ).toBeInTheDocument();
  });

  it("renders copyright notice", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/Copyright © 2026 Michael Smith/i),
    ).toBeInTheDocument();
  });
});
