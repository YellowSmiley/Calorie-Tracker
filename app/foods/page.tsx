import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserFoodsClient from "./UserFoodsClient";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "My Foods - Calorie Tracker",
  description: "View and manage your created foods",
};

export default async function UserFoodsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user's created foods
  const foods = await prisma.food.findMany({
    where: {
      createdBy: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch user settings for the CreateFoodSidebar
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieUnit: true,
      macroUnit: true,
      weightUnit: true,
      volumeUnit: true,
    },
  });

  const userSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    macroUnit: user?.macroUnit ?? "g",
    weightUnit: user?.weightUnit ?? "g",
    volumeUnit: user?.volumeUnit ?? "ml",
  };

  return (
    <div className="min-h-full">
      <UserFoodsClient initialFoods={foods} userSettings={userSettings} />
    </div>
  );
}
