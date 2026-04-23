import type { User as PrismaUser } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: PrismaUser & DefaultSession["user"];
  }

  interface User {
    id: string;
    isAdmin?: boolean;
    isPremium?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    isAdmin?: boolean;
    isPremium?: boolean;
  }
}
