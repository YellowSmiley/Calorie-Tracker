import { z } from "zod";

export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

export const isoDateSchema = z
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

export const resourceIdParamsSchema = z
  .object({
    id: z.string().trim().min(1, "Id is required"),
  })
  .passthrough();

export const searchPaginationQuerySchema = z
  .object({
    search: z.string().optional(),
    take: z.coerce.number().int().min(0).max(200).optional(),
    skip: z.coerce.number().int().min(0).optional(),
  })
  .passthrough();

export const dashboardGetQuerySchema = z
  .object({
    range: z.enum(["day", "week", "month"]).optional(),
    chartRange: z.enum(["1m", "3m", "6m", "1y", "all"]).optional(),
    date: isoDateSchema.optional(),
  })
  .passthrough();

export const authEmailBodySchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
  })
  .passthrough();

export const authRegisterBodySchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .passthrough();

export const authResetPasswordBodySchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
    token: z.string().trim().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .passthrough();

export const authVerifyQuerySchema = z
  .object({
    token: z.string().trim().min(1, "Missing token"),
    email: z.string().trim().email("Invalid email address"),
  })
  .passthrough();

export const adminFoodUpsertBodySchema = z
  .object({
    name: z.string().trim().min(1, "Invalid food name").max(200),
    measurementType: z.enum(["weight", "volume"], {
      message: "Invalid measurement type",
    }),
    measurementAmount: z.number().positive().max(100000),
    calories: z.number().min(0).max(99999),
    protein: z.number().min(0).max(9999),
    carbs: z.number().min(0).max(9999),
    fat: z.number().min(0).max(9999),
    saturates: z.number().min(0).max(9999),
    sugars: z.number().min(0).max(9999),
    fibre: z.number().min(0).max(9999),
    salt: z.number().min(0).max(9999),
    defaultServingAmount: z
      .number()
      .positive()
      .max(100000)
      .nullable()
      .optional(),
    defaultServingDescription: z.string().trim().max(50).nullable().optional(),
  })
  .passthrough();

export const adminUserActionSchema = z.enum([
  "addMark",
  "removeMark",
  "activate",
  "deactivate",
  "clearPunishments",
]);

export const adminUserPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email("Invalid email address").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    action: adminUserActionSchema.optional(),
  })
  .passthrough();

export const mealFavoriteApplyBodySchema = z
  .object({
    favoriteId: z.string().trim().min(1, "Favorite id is required"),
    date: isoDateSchema,
    mealType: mealTypeSchema.optional(),
  })
  .passthrough();

export const mealFavoriteSaveCurrentBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    mealType: mealTypeSchema,
    date: isoDateSchema,
  })
  .passthrough();

export const mealFavoriteClearMealBodySchema = z
  .object({
    mealType: mealTypeSchema,
    date: isoDateSchema,
  })
  .passthrough();
