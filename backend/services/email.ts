export async function sendVerificationEmail(email: string, token: string) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: Verify your email, Body: Click here to verify: /api/auth/verify/${token}`);
}

export async function sendPasswordResetEmail(email: string, token: string) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: Reset your password, Body: Click here to reset: /api/auth/reset-password?token=${token}`);
}
