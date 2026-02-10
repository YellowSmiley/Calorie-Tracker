/**
 * Sanitised logger — suppresses stack traces and error details in production.
 */
export function logError(context: string, error: unknown) {
    if (process.env.NODE_ENV === "production") {
        console.error(`[${context}] An error occurred`);
    } else {
        console.error(`[${context}]`, error);
    }
}
