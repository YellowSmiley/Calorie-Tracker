import { auth } from "@/auth";
import { apiUnauthorized } from "@/lib/apiResponse";

export type ApiGuardUser = {
  id: string;
  isAdmin: boolean;
};

type GuardSuccess = {
  user: ApiGuardUser;
};

type GuardFailure = {
  response: ReturnType<typeof apiUnauthorized>;
};

export type ApiGuardResult = GuardSuccess | GuardFailure;

export async function requireUser(): Promise<ApiGuardResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { response: apiUnauthorized() };
  }

  return {
    user: {
      id: userId,
      isAdmin: Boolean(session.user.isAdmin),
    },
  };
}

export async function requireAdmin(): Promise<ApiGuardResult> {
  const guard = await requireUser();

  if ("response" in guard) {
    return guard;
  }

  if (!guard.user.isAdmin) {
    return { response: apiUnauthorized() };
  }

  return guard;
}
