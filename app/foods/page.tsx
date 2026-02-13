import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserFoodsClient from "./UserFoodsClient";
import { Metadata } from "next";
import { UserSettings } from "../settings/types";

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
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieUnit: true,
      macroUnit: true,
      weightUnit: true,
      volumeUnit: true,
    },
  });

  const userSettings: UserSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    macroUnit: user?.macroUnit ?? "g",
    weightUnit: user?.weightUnit ?? "g",
    volumeUnit: user?.volumeUnit ?? "ml",
  };

  return (
    <div className="min-h-full">
      <UserFoodsClient userSettings={userSettings} />
    </div>
  );
}
