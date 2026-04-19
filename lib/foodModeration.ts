import fs from "node:fs";
import path from "node:path";

const FALLBACK_BLOCKED_TERMS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "nigga",
];

function loadBlockedTerms(): string[] {
  try {
    const sourcePath = path.join(
      process.cwd(),
      "node_modules",
      "badwords-list",
      "dist",
      "array.js",
    );
    const source = fs.readFileSync(sourcePath, "utf8");
    const matches = source.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g);
    const terms = [...matches]
      .map((match) =>
        match[1]
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\")
          .trim()
          .toLowerCase(),
      )
      .filter((term) => term.length > 0);

    if (terms.length > 0) {
      return [...new Set(terms)];
    }
  } catch {
    // Fall back to a small list if package data cannot be read at runtime.
  }

  return FALLBACK_BLOCKED_TERMS;
}

const BLOCKED_TERMS = loadBlockedTerms();

const BLOCKED_PATTERNS = BLOCKED_TERMS.map(
  (term) =>
    new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i"),
);

const COMPACT_BLOCKED_TERMS = BLOCKED_TERMS.map((term) =>
  term.toLowerCase().replace(/[^a-z0-9]/g, ""),
).filter((term) => term.length >= 4);

export function containsBlockedLanguage(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  // Catch merged profanity chunks like "cunt...fuck" that avoid word boundaries.
  const compactNormalized = normalized.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = new Set<string>();

  for (const term of COMPACT_BLOCKED_TERMS) {
    if (compactNormalized.includes(term)) {
      hits.add(term);
      if (hits.size >= 2) {
        return true;
      }
    }
  }

  return false;
}

export function validateFoodNumbersForModeration(input: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
}): string | null {
  if (input.calories > 900) {
    return "Calories look unusually high. Please check and try again.";
  }

  if (input.protein > 100 || input.carbs > 100 || input.fat > 100) {
    return "Macros look unusually high. Please check and try again.";
  }

  if (input.saturates > 100 || input.sugars > 100 || input.fibre > 100) {
    return "Nutrition values look unusually high. Please check and try again.";
  }

  if (input.salt > 25) {
    return "Salt looks unusually high. Please check and try again.";
  }

  return null;
}
