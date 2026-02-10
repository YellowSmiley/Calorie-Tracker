import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import crypto, { createHash } from "crypto";
import { logError } from "@/lib/logger";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
    const rateLimited = await checkAuthRateLimit(request);
    if (rateLimited) return rateLimited;

    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 },
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Always return success to prevent enumeration
        const successResponse = () =>
            NextResponse.json({
                success: true,
                message: "If an account exists with that email, a password reset link has been sent.",
            });

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, passwordHash: true },
        });

        // Only send reset email if user exists and has a password (credentials account)
        if (!user || !user.passwordHash) {
            return successResponse();
        }

        // Delete any existing reset tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { identifier: `reset:${normalizedEmail}` },
        });

        // Generate a new reset token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        await prisma.verificationToken.create({
            data: {
                identifier: `reset:${normalizedEmail}`,
                token: tokenHash,
                expires,
            },
        });

        await sendPasswordResetEmail(normalizedEmail, token);

        return successResponse();
    } catch (error) {
        logError("auth/forgot-password", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 },
        );
    }
}
