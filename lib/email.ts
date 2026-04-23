import nodemailer from "nodemailer";
import { getRuntimeEnv } from "@/lib/runtimeEnv";

const runtimeEnv = getRuntimeEnv();

const transporter = nodemailer.createTransport({
    host: runtimeEnv.SMTP_HOST,
    port: Number(runtimeEnv.SMTP_PORT),
    secure: runtimeEnv.SMTP_SECURE === "true",
    auth: {
        user: runtimeEnv.SMTP_USER,
        pass: runtimeEnv.SMTP_PASSWORD,
    },
});

const FROM_ADDRESS = runtimeEnv.SMTP_FROM;

export async function sendVerificationEmail(email: string, token: string) {
    const baseUrl = runtimeEnv.AUTH_URL;
    const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
        from: FROM_ADDRESS,
        to: email,
        subject: "Verify your email — Calorie Tracker",
        text: `Welcome to Calorie Tracker!\n\nPlease verify your email by visiting this link:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="margin-bottom: 16px;">Welcome to Calorie Tracker!</h2>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${verifyUrl}"
                   style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                    Verify Email
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
                <p style="color: #666; font-size: 14px;">If you didn&rsquo;t create an account, you can safely ignore this email.</p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = runtimeEnv.AUTH_URL;
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
        from: FROM_ADDRESS,
        to: email,
        subject: "Reset your password — Calorie Tracker",
        text: `You requested a password reset for your Calorie Tracker account.\n\nReset your password by visiting this link:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="margin-bottom: 16px;">Reset your password</h2>
                <p>You requested a password reset for your Calorie Tracker account. Click the button below to choose a new password:</p>
                <a href="${resetUrl}"
                   style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                    Reset Password
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
            </div>
        `,
    });
}
