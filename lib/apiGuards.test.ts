/** @jest-environment node */

import { auth } from "@/auth";
import { requireAdmin, requireUser } from "./apiGuards";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

type MockSession = {
  user?: {
    id?: string;
    isAdmin?: boolean;
  };
} | null;

const mockedAuth = auth as jest.Mock;

const mockAuthSession = (session: MockSession) => {
  mockedAuth.mockResolvedValue(session);
};

describe("apiGuards", () => {
  afterEach(() => {
    mockedAuth.mockReset();
  });

  test("requireUser returns user when session has id", async () => {
    mockAuthSession({
      user: {
        id: "user-1",
        isAdmin: false,
      },
    });

    const result = await requireUser();

    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user).toEqual({ id: "user-1", isAdmin: false });
    }
  });

  test("requireUser returns unauthorized when session is missing", async () => {
    mockAuthSession(null);

    const result = await requireUser();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
    }
  });

  test("requireAdmin returns unauthorized when user is not admin", async () => {
    mockAuthSession({
      user: {
        id: "user-1",
        isAdmin: false,
      },
    });

    const result = await requireAdmin();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
    }
  });

  test("requireAdmin returns user when admin", async () => {
    mockAuthSession({
      user: {
        id: "admin-1",
        isAdmin: true,
      },
    });

    const result = await requireAdmin();

    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user).toEqual({ id: "admin-1", isAdmin: true });
    }
  });
});
