import { Hono } from 'hono';
import { db } from '../db';
import { users, departments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email';

const app = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.post('/register', async (c) => {
    const body = await c.req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) {
        return c.json({ error: 'User already exists' }, 409);
    }

    const passwordHash = await hash(password, 10);

    // Generate verification token (mock)
    const verificationToken = sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    const [result] = await db.insert(users).values({
        name,
        email,
        passwordHash,
        oauthProvider: 'local',
        // emailVerifiedAt: new Date(), // Uncomment to auto-verify for testing
    });

    await sendVerificationEmail(email, verificationToken);

    return c.json({ message: 'User registered. Please verify your email.', userId: result.insertId }, 201);
});

app.post('/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;

    const [result] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            passwordHash: users.passwordHash,
            emailVerifiedAt: users.emailVerifiedAt,
            avatarUrl: users.avatarUrl,
            isAdmin: users.isAdmin,
            departmentId: users.departmentId,
            departmentName: departments.name,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.email, email))
        .limit(1);

    if (!result || !result.passwordHash) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const validPassword = await compare(password, result.passwordHash);
    if (!validPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (!result.emailVerifiedAt) {
        return c.json({ error: 'Email not verified' }, 403);
    }

    const token = sign({ sub: result.id, email: result.email, role: result.isAdmin ? 'admin' : 'user' }, JWT_SECRET, { expiresIn: '7d' });

    return c.json({
        token,
        user: {
            id: result.id,
            name: result.name,
            email: result.email,
            avatarUrl: result.avatarUrl,
            isAdmin: result.isAdmin,
            departmentName: result.departmentName
        }
    });
});

app.get('/verify/:token', async (c) => {
    const token = c.req.param('token');
    try {
        const decoded = verify(token, JWT_SECRET) as { email: string };
        const [user] = await db.select().from(users).where(eq(users.email, decoded.email)).limit(1);

        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id));

        return c.json({ message: 'Email verified successfully' });
    } catch (e) {
        return c.json({ error: 'Invalid or expired token' }, 400);
    }
});

app.post('/forgot-password', async (c) => {
    const body = await c.req.json();
    const { email } = body;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user) {
        const resetToken = sign({ sub: user.id, purpose: 'reset_password' }, JWT_SECRET, { expiresIn: '1h' });
        await sendPasswordResetEmail(email, resetToken);
    }

    // Always return success to prevent enumeration
    return c.json({ message: 'If the email exists, a reset link has been sent.' });
});

app.post('/reset-password', async (c) => {
    const body = await c.req.json();
    const { token, newPassword } = body;

    try {
        const decoded = verify(token, JWT_SECRET) as unknown as { sub: number, purpose: string };
        if (decoded.purpose !== 'reset_password') {
            throw new Error('Invalid token purpose');
        }

        const passwordHash = await hash(newPassword, 10);
        await db.update(users).set({ passwordHash }).where(eq(users.id, decoded.sub));

        return c.json({ message: 'Password reset successfully' });
    } catch (e) {
        return c.json({ error: 'Invalid or expired token' }, 400);
    }
});

export default app;
