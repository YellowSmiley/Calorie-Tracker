import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@example.com";

export async function sendVerificationEmail(email: string, token: string) {
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
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
