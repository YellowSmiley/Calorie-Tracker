import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { prisma } from "@/lib/prisma";
import { AcceptedWeightedUnits, UserSettings } from "./types";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user settings
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieUnit: true,
      weightUnit: true,
      volumeUnit: true,
    },
  })) as UserSettings;

  const userSettings: UserSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    weightUnit: (user?.weightUnit as AcceptedWeightedUnits) ?? "g",
    volumeUnit: user?.volumeUnit ?? "ml",
  };

  return <SettingsClient userSettings={userSettings} />;
}
