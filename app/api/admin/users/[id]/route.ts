import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import bcrypt from "bcryptjs";

type ModerationAction =
  | "addMark"
  | "removeMark"
  | "activate"
  | "deactivate"
  | "clearPunishments";

async function selectUserForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      provider: true,
      isActive: true,
      blackMarks: true,
      bannedAt: true,
      lastKnownIp: true,
    },
  });
}

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
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      action?: ModerationAction;
    };

    if (body.action) {
      const targetUser = await selectUserForAdmin(userId);

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (
        (body.action === "deactivate" || body.action === "addMark") &&
        userId === session.user.id
      ) {
        return NextResponse.json(
          { error: "You cannot punish or deactivate your own account." },
          { status: 400 },
        );
      }

      const updatedUser = await prisma.$transaction(async (tx) => {
        if (body.action === "addMark") {
          const marked = await tx.user.update({
            where: { id: userId },
            data: { blackMarks: { increment: 1 } },
            select: { blackMarks: true, email: true, lastKnownIp: true },
          });

          if (marked.blackMarks >= 3) {
            await tx.user.update({
              where: { id: userId },
              data: { isActive: false, bannedAt: new Date() },
            });

            if (marked.email) {
              await tx.blacklistEntry.upsert({
                where: {
                  entryType_value: {
                    entryType: "email",
                    value: marked.email.toLowerCase().trim(),
                  },
                },
                update: { reason: "Auto-blacklisted after 3 moderation marks" },
                create: {
                  entryType: "email",
                  value: marked.email.toLowerCase().trim(),
                  reason: "Auto-blacklisted after 3 moderation marks",
                },
              });
            }

            if (marked.lastKnownIp) {
              await tx.blacklistEntry.upsert({
                where: {
                  entryType_value: {
                    entryType: "ip",
                    value: marked.lastKnownIp,
                  },
                },
                update: { reason: "Auto-blacklisted after 3 moderation marks" },
                create: {
                  entryType: "ip",
                  value: marked.lastKnownIp,
                  reason: "Auto-blacklisted after 3 moderation marks",
                },
              });
            }
          }
        }

        if (body.action === "removeMark") {
          const nextMarks = Math.max(0, targetUser.blackMarks - 1);
          await tx.user.update({
            where: { id: userId },
            data: {
              blackMarks: nextMarks,
              bannedAt: nextMarks < 3 ? null : targetUser.bannedAt,
            },
          });
        }

        if (body.action === "activate") {
          await tx.user.update({
            where: { id: userId },
            data: { isActive: true },
          });
        }

        if (body.action === "deactivate") {
          await tx.user.update({
            where: { id: userId },
            data: {
              isActive: false,
              bannedAt: targetUser.bannedAt ?? new Date(),
            },
          });
        }

        if (body.action === "clearPunishments") {
          await tx.user.update({
            where: { id: userId },
            data: {
              blackMarks: 0,
              bannedAt: null,
              isActive: true,
            },
          });

          if (targetUser.email) {
            await tx.blacklistEntry.deleteMany({
              where: {
                entryType: "email",
                value: targetUser.email.toLowerCase().trim(),
              },
            });
          }

          if (targetUser.lastKnownIp) {
            await tx.blacklistEntry.deleteMany({
              where: {
                entryType: "ip",
                value: targetUser.lastKnownIp,
              },
            });
          }
        }

        return tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true,
            provider: true,
            isActive: true,
            blackMarks: true,
            bannedAt: true,
          },
        });
      });

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, user: updatedUser });
    }

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        provider: true,
        isActive: true,
        blackMarks: true,
        bannedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    logError("admin/users/PATCH", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

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
