import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import * as nextAuth from "next-auth/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Keep LoginPage tests unit-scoped by avoiding router/loading hook behavior.
jest.mock("@/app/components/PendingLink", () => {
  return function MockPendingLink({
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

// Mock fetch for check-verified endpoint
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Google sign-in", () => {
    it("calls signIn with google provider and correct callback", async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined);
      (nextAuth.signIn as jest.Mock).mockImplementation(mockSignIn);

      render(<LoginPage />);
      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("google", {
          callbackUrl: "/",
        });
      });
    });

    it("only shows Google loading spinner during Google sign-in", async () => {
      (nextAuth.signIn as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      render(<LoginPage />);
      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Signing in...")).toBeInTheDocument();
      });
    });

    it("disables all buttons while Google sign-in is in progress", async () => {
      (nextAuth.signIn as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      render(<LoginPage />);
      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        buttons.forEach((btn) => expect(btn).toBeDisabled());
      });
    });
  });

  describe("Credentials sign-in", () => {
    it("calls signIn with credentials provider and redirect: false", async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ ok: true });
      (nextAuth.signIn as jest.Mock).mockImplementation(mockSignIn);

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@test.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("sign-in-button"));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "user@test.com",
          password: "password123",
          redirect: false,
        });
      });
    });

    it("does not show error on successful sign-in", async () => {
      (nextAuth.signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@test.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("sign-in-button"));

      await waitFor(() => {
        expect(screen.queryByText(/failed to login/i)).not.toBeInTheDocument();
      });
    });

    it("shows error on failed sign-in", async () => {
      (nextAuth.signIn as jest.Mock).mockResolvedValue({ ok: false });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@test.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByTestId("sign-in-button"));

      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument();
      });
    });

    it("clears previous error on new sign-in attempt", async () => {
      // First attempt fails
      (nextAuth.signIn as jest.Mock).mockResolvedValue({ ok: false });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@test.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "wrong" },
      });
      fireEvent.click(screen.getByTestId("sign-in-button"));

      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument();
      });
      (nextAuth.signIn as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );
      fireEvent.click(screen.getByTestId("sign-in-button"));

      await waitFor(() => {
        expect(screen.queryByText(/failed to login/i)).not.toBeInTheDocument();
      });
    });
  });
});
