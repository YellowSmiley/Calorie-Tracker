import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { getRuntimeEnv } from "@/lib/runtimeEnv";
import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARB_GOAL,
  DEFAULT_FAT_GOAL,
  DEFAULT_CALORIE_UNIT,
  DEFAULT_WEIGHT_UNIT,
  DEFAULT_VOLUME_UNIT,
  DEFAULT_FIBRE_GOAL,
  DEFAULT_SALT_GOAL,
  DEFAULT_SATURATES_GOAL,
  DEFAULT_SUGARS_GOAL,
} from "./lib/consts";
import { getClientIp } from "@/lib/blacklist";

const runtimeEnv = getRuntimeEnv();

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
      clientId: runtimeEnv.AUTH_GOOGLE_ID,
      clientSecret: runtimeEnv.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        const ip = request?.headers ? getClientIp(request.headers) : null;

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
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            emailVerified: true,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const blacklistedEmail = await prisma.blacklistEntry.findFirst({
          where: {
            entryType: "email",
            value: email,
          },
          select: { id: true },
        });

        if (blacklistedEmail) {
          return null;
        }

        if (ip) {
          const blacklistedIp = await prisma.blacklistEntry.findFirst({
            where: {
              entryType: "ip",
              value: ip,
            },
            select: { id: true },
          });

          if (blacklistedIp) {
            return null;
          }
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        if (ip) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastKnownIp: ip },
          });
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
      if (!user?.id) {
        return false;
      }

      const existingForModeration = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          email: true,
          isActive: true,
        },
      });

      if (!existingForModeration?.isActive) {
        return false;
      }

      if (existingForModeration.email) {
        const blacklistedEmail = await prisma.blacklistEntry.findFirst({
          where: {
            entryType: "email",
            value: existingForModeration.email.toLowerCase().trim(),
          },
          select: { id: true },
        });

        if (blacklistedEmail) {
          return false;
        }
      }

      // Apply defaults on first sign-in
      if (user.id) {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            calorieGoal: true,
            calorieUnit: true,
            carbGoal: true,
            fatGoal: true,
            weightUnit: true,
            volumeUnit: true,
            proteinGoal: true,
            saturatesGoal: true,
            sugarsGoal: true,
            fibreGoal: true,
            saltGoal: true,
          },
        });

        // If user exists but doesn't have defaults, apply them
        if (
          existingUser &&
          (existingUser.calorieGoal === null ||
            existingUser.calorieUnit === null ||
            existingUser.saturatesGoal === null ||
            existingUser.sugarsGoal === null ||
            existingUser.fibreGoal === null ||
            existingUser.saltGoal === null)
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              calorieGoal: existingUser.calorieGoal ?? DEFAULT_CALORIE_GOAL,
              proteinGoal: existingUser.proteinGoal ?? DEFAULT_PROTEIN_GOAL,
              carbGoal: existingUser.carbGoal ?? DEFAULT_CARB_GOAL,
              fatGoal: existingUser.fatGoal ?? DEFAULT_FAT_GOAL,
              calorieUnit: existingUser.calorieUnit ?? DEFAULT_CALORIE_UNIT,
              weightUnit: existingUser.weightUnit ?? DEFAULT_WEIGHT_UNIT,
              volumeUnit: existingUser.volumeUnit ?? DEFAULT_VOLUME_UNIT,
              fibreGoal: existingUser.fibreGoal ?? DEFAULT_FIBRE_GOAL,
              saltGoal: existingUser.saltGoal ?? DEFAULT_SALT_GOAL,
              saturatesGoal:
                existingUser.saturatesGoal ?? DEFAULT_SATURATES_GOAL,
              sugarsGoal: existingUser.sugarsGoal ?? DEFAULT_SUGARS_GOAL,
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
          select: { isAdmin: true, isPremium: true },
        });
        token.isAdmin = dbUser?.isAdmin ?? false;
        token.isPremium = dbUser?.isPremium ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
        session.user.isPremium = (token.isPremium as boolean) ?? false;
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
