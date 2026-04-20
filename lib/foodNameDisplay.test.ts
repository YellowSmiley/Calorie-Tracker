import { formatFoodNameForDisplay } from "./foodNameDisplay";

describe("formatFoodNameForDisplay", () => {
  it("formats all lowercase names", () => {
    expect(formatFoodNameForDisplay("grilled chicken breast")).toBe(
      "Grilled Chicken Breast",
    );
  });

  it("formats all uppercase names", () => {
    expect(formatFoodNameForDisplay("PEANUT BUTTER")).toBe("Peanut Butter");
  });

  it("keeps mixed-case names unchanged", () => {
    expect(formatFoodNameForDisplay("McChicken Deluxe")).toBe(
      "McChicken Deluxe",
    );
  });

  it("preserves separators while applying capitalization", () => {
    expect(formatFoodNameForDisplay("salt-and-vinegar_chips")).toBe(
      "Salt-And-Vinegar_Chips",
    );
  });

  it("returns original text when no letters are present", () => {
    expect(formatFoodNameForDisplay("123 / 456")).toBe("123 / 456");
  });
});
