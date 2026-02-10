import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
    const rateLimited = await checkAuthRateLimit(request);
    if (rateLimited) return rateLimited;

    try {
        const { email } = await request.json();

        if (!email) {
            // Add constant-time delay to prevent timing-based enumeration
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
            return NextResponse.json({ unverified: false });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { emailVerified: true, passwordHash: true },
        });

        // Only flag as unverified if the user exists with a password but no verification
        const unverified = !!user && !!user.passwordHash && !user.emailVerified;

        // Constant-time delay to prevent timing-based enumeration
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

        return NextResponse.json({ unverified });
    } catch {
        return NextResponse.json({ unverified: false });
    }
}
