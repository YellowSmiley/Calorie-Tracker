import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ unverified: false });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { emailVerified: true, passwordHash: true },
        });

        // Only flag as unverified if the user exists with a password but no verification
        const unverified = !!user && !!user.passwordHash && !user.emailVerified;

        return NextResponse.json({ unverified });
    } catch {
        return NextResponse.json({ unverified: false });
    }
}
