import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { prisma } from "@/lib/prisma";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedVolumeUnits,
  AcceptedWeightedUnits,
  SettingsData,
  UserSettings,
} from "./types";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user settings
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieGoal: true,
      proteinGoal: true,
      carbGoal: true,
      fatGoal: true,
      saturatesGoal: true,
      sugarsGoal: true,
      fibreGoal: true,
      saltGoal: true,
      calorieUnit: true,
      weightUnit: true,
      bodyWeightUnit: true,
      volumeUnit: true,
    },
  });

  const initialSettings: SettingsData = {
    calorieGoal: user?.calorieGoal ?? 3000,
    proteinGoal: user?.proteinGoal ?? 150,
    carbGoal: user?.carbGoal ?? 410,
    fatGoal: user?.fatGoal ?? 83,
    saturatesGoal: user?.saturatesGoal ?? 20,
    sugarsGoal: user?.sugarsGoal ?? 90,
    fibreGoal: user?.fibreGoal ?? 30,
    saltGoal: user?.saltGoal ?? 6,
    calorieUnit: (user?.calorieUnit as AcceptedCalorieUnits) ?? "kcal",
    weightUnit: (user?.weightUnit as AcceptedWeightedUnits) ?? "g",
    bodyWeightUnit: (user?.bodyWeightUnit as AcceptedBodyWeightUnits) ?? "kg",
    volumeUnit: (user?.volumeUnit as AcceptedVolumeUnits) ?? "ml",
  };

  const userSettings: UserSettings = {
    calorieUnit: initialSettings.calorieUnit,
    weightUnit: initialSettings.weightUnit,
    bodyWeightUnit: initialSettings.bodyWeightUnit,
    volumeUnit: initialSettings.volumeUnit,
  };

  return (
    <SettingsClient
      userSettings={userSettings}
      initialSettings={initialSettings}
    />
  );
}
