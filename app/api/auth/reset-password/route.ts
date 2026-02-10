import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { createHash } from "crypto";
import { logError } from "@/lib/logger";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
    const rateLimited = await checkAuthRateLimit(request);
    if (rateLimited) return rateLimited;

    try {
        const { email, token, password } = await request.json();

        if (!email || !token || !password) {
            return NextResponse.json(
                { error: "Email, token, and new password are required" },
                { status: 400 },
            );
        }

        if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json(
                { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
                { status: 400 },
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const tokenHash = createHash("sha256").update(token).digest("hex");

        const record = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: `reset:${normalizedEmail}`,
                    token: tokenHash,
                },
            },
        });

        if (!record) {
            return NextResponse.json(
                { error: "Invalid or expired reset link" },
                { status: 400 },
            );
        }

        if (record.expires < new Date()) {
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: `reset:${normalizedEmail}`,
                        token: tokenHash,
                    },
                },
            });
            return NextResponse.json(
                { error: "Reset link has expired. Please request a new one." },
                { status: 400 },
            );
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await prisma.$transaction([
            prisma.user.update({
                where: { email: normalizedEmail },
                data: { passwordHash },
            }),
            prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: `reset:${normalizedEmail}`,
                        token: tokenHash,
                    },
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("auth/reset-password", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 },
        );
    }
}
