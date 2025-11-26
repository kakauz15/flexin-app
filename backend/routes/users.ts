import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// List users
app.get('/', async (c) => {
    const allUsers = await db.select().from(users);
    return c.json(allUsers);
});

// Get user by id
app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const user = await db.select().from(users).where(eq(users.id, id)).get();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
});

// Update user (restricted)
app.put('/:id', async (c) => {
    // TODO: Add auth check
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    // Filter allowed fields
    const { name, departmentId, avatarUrl } = body;

    const updatedUser = await db.update(users)
        .set({ name, departmentId, avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
        .get();

    if (!updatedUser) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json(updatedUser);
});

// Upload avatar
app.put('/avatar', async (c) => {
    // TODO: Implement file upload logic
    return c.json({ message: 'Avatar upload not implemented yet' });
});

// Delete user (admin only)
app.delete('/:id', async (c) => {
    // TODO: Add admin check
    const id = Number(c.req.param('id'));
    const deleted = await db.delete(users).where(eq(users.id, id)).returning().get();

    if (!deleted) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'User deleted' });
});

export default app;
