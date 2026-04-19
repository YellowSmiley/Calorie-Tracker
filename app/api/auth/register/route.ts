import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { checkRegisterRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import crypto, { createHash } from "crypto";
import { getClientIp } from "@/lib/blacklist";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_EXPIRY_HOURS = 24;

const SUCCESS_MESSAGE =
  "If that email is available, you will receive a verification link shortly.";

function successResponse() {
  return NextResponse.json(
    { success: true, message: SUCCESS_MESSAGE },
    { status: 201 },
  );
}

export async function POST(request: Request) {
  const rateLimited = await checkRegisterRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(request.headers);

    const emailBlocked = await prisma.blacklistEntry.findFirst({
      where: {
        entryType: "email",
        value: normalizedEmail,
      },
      select: { id: true },
    });

    if (emailBlocked) {
      return successResponse();
    }

    if (ip) {
      const ipBlocked = await prisma.blacklistEntry.findFirst({
        where: {
          entryType: "ip",
          value: ip,
        },
        select: { id: true },
      });

      if (ipBlocked) {
        return successResponse();
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Don't reveal that the account exists — return same response as success
      return successResponse();
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        passwordHash,
        lastKnownIp: ip,
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenHash,
        expires,
      },
    });

    // Send verification email
    await sendVerificationEmail(normalizedEmail, token);

    return successResponse();
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
