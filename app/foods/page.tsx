import { auth } from "@/auth";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserFoodsClient from "./UserFoodsClient";
import { Metadata } from "next";
import { AcceptedWeightedUnits, UserSettings } from "../settings/types";
import {
  CACHE_TAGS,
  CACHE_DURATIONS,
  getUnstableCacheRevalidate,
} from "@/lib/cacheKeys";

export const metadata: Metadata = {
  title: "My Foods - Calorie Tracker",
  description: "View and manage your created foods",
};

export default async function UserFoodsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user settings
  const user = (await unstable_cache(
    async () =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          calorieUnit: true,
          weightUnit: true,
          volumeUnit: true,
        },
      }),
    [CACHE_TAGS.userSettings(session.user.id)],
    {
      revalidate: getUnstableCacheRevalidate(CACHE_DURATIONS.userSettings),
      tags: [CACHE_TAGS.userSettings(session.user.id)],
    },
  )()) as UserSettings;

  const userSettings: UserSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    weightUnit: (user?.weightUnit as AcceptedWeightedUnits) ?? "g",
    volumeUnit: user?.volumeUnit ?? "ml",
  };

  return (
    <div className="min-h-full">
      <UserFoodsClient userSettings={userSettings} />
    </div>
  );
}
