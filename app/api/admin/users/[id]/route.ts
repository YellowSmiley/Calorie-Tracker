import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: userId } = (await params) as { id: string };
    const body = await request.json();
    const { name, email, password } = body;

    const updateData: { name?: string; email?: string; passwordHash?: string } =
      {};
    if (typeof name === "string") updateData.name = name;
    if (typeof email === "string") updateData.email = email;
    if (typeof password === "string" && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("admin/users/PATCH", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: userId } = (await params) as { id: string };

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Prevent deleting the last admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (targetUser?.isAdmin) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin" },
          { status: 400 },
        );
      }
    }

    // Delete user and all their data (cascade handles it)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("admin/users/DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
