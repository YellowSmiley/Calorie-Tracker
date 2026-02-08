import { render, screen } from "@testing-library/react";
import DiaryPage from "./page";
import * as authModule from "@/auth";
import { prisma } from "@/lib/prisma";
import { DiaryClientProps } from "./DiaryClient";

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    food: {
      findMany: jest.fn(),
    },
    mealEntry: {
      findMany: jest.fn(),
    },
  },
}));

// Mock the DiaryClient component
jest.mock("./DiaryClient", () => {
  return function MockDiaryClient(props: DiaryClientProps) {
    return (
      <div data-testid="diary-client">
        <div data-testid="active-date">{props.activeDate}</div>
        <div data-testid="meals-count">{props.initialMeals.length}</div>
        <div data-testid="foods-count">{props.initialFoods.length}</div>
      </div>
    );
  };
});

describe("DiaryPage", () => {
  const mockUser = {
    id: "user-123",
    calorieUnit: "kcal",
    macroUnit: "g",
    weightUnit: "g",
    volumeUnit: "ml",
    calorieGoal: 2500,
    proteinGoal: 150,
    carbGoal: 310,
    fatGoal: 83,
  };

  const mockFoods = [
    {
      id: "food-1",
      name: "Chicken Breast",
      measurement: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    },
    {
      id: "food-2",
      name: "Brown Rice",
      measurement: "g",
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
    },
  ];

  const mockMealEntries = [
    {
      id: "entry-1",
      mealType: "BREAKFAST",
      calories: 200,
      protein: 20,
      carbs: 30,
      fat: 5,
      serving: 1,
      food: mockFoods[0],
    },
    {
      id: "entry-2",
      mealType: "LUNCH",
      calories: 400,
      protein: 35,
      carbs: 50,
      fat: 10,
      serving: 1.5,
      food: mockFoods[1],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders DiaryClient component with correct props", async () => {
    // Mock auth to return a user session
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });

    // Mock prisma calls
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue(mockMealEntries);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    expect(screen.getByTestId("diary-client")).toBeInTheDocument();
  });

  it("uses current date when no date parameter provided", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue([]);

    const searchParams = Promise.resolve({});

    render(await DiaryPage({ searchParams }));

    // Should render with today's date
    const dateElement = screen.getByTestId("active-date");
    const date = dateElement.textContent;
    // Just verify it rendered a date in ISO format
    expect(date).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("fetches user settings from database", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue([]);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      select: {
        calorieUnit: true,
        macroUnit: true,
        weightUnit: true,
        volumeUnit: true,
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
      },
    });
  });

  it("fetches all foods ordered by name", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue([]);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    expect(prisma.food.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
  });

  it("fetches meal entries for the specified date", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue(mockMealEntries);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    expect(prisma.mealEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
      }),
    );
  });

  it("passes the correct meal structure to DiaryClient", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue(mockMealEntries);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    // DiaryClient should receive all meal types (Breakfast, Lunch, Dinner, Snack)
    const mealsCount = screen.getByTestId("meals-count");
    expect(mealsCount.textContent).toBe("4");
  });

  it("uses default values when user settings are not found", async () => {
    (authModule.auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser.id },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.food.findMany as jest.Mock).mockResolvedValue(mockFoods);
    (prisma.mealEntry.findMany as jest.Mock).mockResolvedValue([]);

    const searchParams = Promise.resolve({ date: "2026-02-08" });

    render(await DiaryPage({ searchParams }));

    expect(screen.getByTestId("diary-client")).toBeInTheDocument();
  });
});
