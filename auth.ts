import NextAuth from "next-auth"
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

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
    trustHost: true,
    logger: {
        error: (error) => {
            // Suppress expected CredentialsSignin errors (wrong password, rate limited, etc.)
            if (error?.name === "CredentialsSignin") return;
            console.error(error);
        },
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = String(credentials?.email ?? "").toLowerCase().trim();
                const password = String(credentials?.password ?? "");

                if (!email || !password) {
                    return null;
                }

                // Rate limit login attempts per email
                const allowed = await checkLoginRateLimit(email);
                if (!allowed) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: { id: true, email: true, name: true, passwordHash: true, emailVerified: true },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

                if (!user.emailVerified) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            // Fetch isAdmin on every token refresh to stay in sync
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { isAdmin: true },
                });
                token.isAdmin = dbUser?.isAdmin ?? false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isAdmin = (token.isAdmin as boolean) ?? false;
            }
            return session;
        },
    },
});

export const { GET, POST } = handlers;
