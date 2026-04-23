import { describe, expect, it } from "@jest/globals";
import {
  hasPremiumAccess,
  parseStripePeriodEndDate,
} from "./subscriptionService";

describe("subscriptionService", () => {
  describe("parseStripePeriodEndDate", () => {
    it("returns null when period end is missing", () => {
      expect(parseStripePeriodEndDate(undefined)).toBeNull();
      expect(parseStripePeriodEndDate(null)).toBeNull();
    });

    it("converts unix seconds to date", () => {
      const date = parseStripePeriodEndDate(1_700_000_000);
      expect(date?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    });
  });

  describe("hasPremiumAccess", () => {
    it("returns true for active subscription with valid period", () => {
      const now = 1_700_000_000_000;
      const periodEnd = 1_700_000_100;
      expect(hasPremiumAccess("active", periodEnd, now)).toBe(true);
    });

    it("returns false for canceled status", () => {
      const now = 1_700_000_000_000;
      const periodEnd = 1_700_000_100;
      expect(hasPremiumAccess("canceled", periodEnd, now)).toBe(false);
    });

    it("returns false when current period has expired", () => {
      const now = 1_700_000_000_000;
      const periodEnd = 1_699_999_900;
      expect(hasPremiumAccess("active", periodEnd, now)).toBe(false);
    });

    it("allows active/trialing status when period end is missing", () => {
      expect(hasPremiumAccess("active", undefined, 1_700_000_000_000)).toBe(
        true,
      );
      expect(hasPremiumAccess("trialing", undefined, 1_700_000_000_000)).toBe(
        true,
      );
    });
  });
});
