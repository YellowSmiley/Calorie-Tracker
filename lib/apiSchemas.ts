import { z } from "zod";

export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

const calorieUnitSchema = z.enum(["kcal", "kJ"]);
const weightUnitSchema = z.enum(["g", "kg", "oz", "lbs", "mg"]);
const bodyWeightUnitSchema = z.enum(["kg", "lbs"]);
const volumeUnitSchema = z.enum(["ml", "cup", "tbsp", "tsp", "L"]);

const mealFavoriteItemSchema = z.object({
  foodId: z.string().trim().min(1, "Food id is required"),
  serving: z.number().positive().max(1000),
});

export const mealsGetQuerySchema = z
  .object({
    date: isoDateSchema.optional(),
  })
  .passthrough();

export const mealsPostBodySchema = z
  .object({
    mealType: mealTypeSchema,
    foodId: z.string().trim().min(1, "Food id is required"),
    serving: z.number().positive().max(1000).optional(),
    date: isoDateSchema.optional(),
  })
  .passthrough();

export const mealEntryPatchBodySchema = z
  .object({
    serving: z.number().positive().max(1000),
  })
  .passthrough();

export const mealEntryParamsSchema = z
  .object({
    id: z.string().trim().min(1, "Entry id is required"),
  })
  .passthrough();

export const foodReportBodySchema = z
  .object({
    foodId: z.string().trim().min(1, "Food id is required"),
    reason: z.string().trim().max(250).optional(),
  })
  .passthrough();

export const bodyWeightDateQuerySchema = z
  .object({
    date: isoDateSchema.optional(),
  })
  .passthrough();

export const bodyWeightPutBodySchema = z
  .object({
    date: isoDateSchema.optional(),
    weight: z.number().positive().max(1000).nullable().optional(),
  })
  .passthrough();

export const settingsPutBodySchema = z
  .object({
    calorieGoal: z.coerce.number().min(0).max(99999),
    proteinGoal: z.coerce.number().min(0).max(9999),
    carbGoal: z.coerce.number().min(0).max(9999),
    fatGoal: z.coerce.number().min(0).max(9999),
    saturatesGoal: z.coerce.number().min(0).max(9999),
    sugarsGoal: z.coerce.number().min(0).max(9999),
    fibreGoal: z.coerce.number().min(0).max(9999),
    saltGoal: z.coerce.number().min(0).max(9999),
    calorieUnit: calorieUnitSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
    bodyWeightUnit: bodyWeightUnitSchema.optional(),
    volumeUnit: volumeUnitSchema.optional(),
  })
  .passthrough();

export const mealFavoriteParamsSchema = z
  .object({
    id: z.string().trim().min(1, "Favorite id is required"),
  })
  .passthrough();

export const mealFavoritesGetQuerySchema = z
  .object({
    mealType: mealTypeSchema.optional(),
    search: z.string().optional(),
    take: z.coerce.number().int().min(0).max(200).optional(),
    skip: z.coerce.number().int().min(0).optional(),
  })
  .passthrough();

export const mealFavoriteCreateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    mealType: mealTypeSchema.optional(),
    items: z.array(mealFavoriteItemSchema).min(1).max(100),
  })
  .passthrough();

export const mealFavoriteUpdateBodySchema = mealFavoriteCreateBodySchema;
