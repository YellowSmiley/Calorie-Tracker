import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user is admin
  const user = session.user;
  if (!user.isAdmin) {
    redirect("/");
  }

  return <AdminClient />;
}
