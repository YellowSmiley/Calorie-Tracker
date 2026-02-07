import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { email: "asc" },
        });

        // Map to include isAdmin from the user object
        const usersWithAdmin = await Promise.all(
            users.map(async (user) => ({
                ...user,
                isAdmin: (await prisma.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } }))?.isAdmin ?? false,
            }))
        );

        return NextResponse.json(usersWithAdmin);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
