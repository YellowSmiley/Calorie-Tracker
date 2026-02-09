import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            return NextResponse.json(
                { error: "Missing token or email" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Look up the verification token
        const record = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: normalizedEmail,
                    token,
                },
            },
        });

        if (!record) {
            return NextResponse.json(
                { error: "Invalid or expired verification link" },
                { status: 400 }
            );
        }

        if (record.expires < new Date()) {
            // Clean up expired token
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: normalizedEmail,
                        token,
                    },
                },
            });
            return NextResponse.json(
                { error: "Verification link has expired. Please register again." },
                { status: 400 }
            );
        }

        // Mark user as verified and delete the token
        await prisma.$transaction([
            prisma.user.update({
                where: { email: normalizedEmail },
                data: { emailVerified: new Date() },
            }),
            prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: normalizedEmail,
                        token,
                    },
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
