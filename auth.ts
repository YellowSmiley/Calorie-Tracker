import NextAuth from "next-auth"
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const DEFAULT_CALORIE_GOAL = 3000;
const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARB_GOAL = 410;
const DEFAULT_FAT_GOAL = 83;
const DEFAULT_CALORIE_UNIT = "kcal";
const DEFAULT_MACRO_UNIT = "g";
const DEFAULT_WEIGHT_UNIT = "g";
const DEFAULT_VOLUME_UNIT = "ml";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
        }),
    ],
    session: {
        strategy: "database",
    },
    callbacks: {
        async signIn({ user }) {
            // Apply defaults on first sign-in
            if (user.id) {
                const existingUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        calorieGoal: true,
                        calorieUnit: true,
                        carbGoal: true,
                        fatGoal: true,
                        macroUnit: true,
                        weightUnit: true,
                        volumeUnit: true,
                        proteinGoal: true,
                    },
                });

                // If user exists but doesn't have defaults, apply them
                if (
                    existingUser &&
                    (existingUser.calorieGoal === null ||
                        existingUser.calorieUnit === null)
                ) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            calorieGoal: existingUser.calorieGoal ?? DEFAULT_CALORIE_GOAL,
                            proteinGoal: existingUser.proteinGoal ?? DEFAULT_PROTEIN_GOAL,
                            carbGoal: existingUser.carbGoal ?? DEFAULT_CARB_GOAL,
                            fatGoal: existingUser.fatGoal ?? DEFAULT_FAT_GOAL,
                            calorieUnit: existingUser.calorieUnit ?? DEFAULT_CALORIE_UNIT,
                            macroUnit: existingUser.macroUnit ?? DEFAULT_MACRO_UNIT,
                            weightUnit: existingUser.weightUnit ?? DEFAULT_WEIGHT_UNIT,
                            volumeUnit: existingUser.volumeUnit ?? DEFAULT_VOLUME_UNIT,
                        },
                    });
                }
            }
            return true;
        },
        session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
});

export const { GET, POST } = handlers;
