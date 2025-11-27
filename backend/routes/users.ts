import { Hono } from 'hono';
import { db } from '../db';
import { users, departments } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// List users
app.get('/', async (c) => {
    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
            isAdmin: users.isAdmin,
            departmentId: users.departmentId,
            departmentName: departments.name,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id));

    return c.json(allUsers);
});

// Get user by id
app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
            isAdmin: users.isAdmin,
            departmentId: users.departmentId,
            departmentName: departments.name,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.id, id))
        .limit(1);

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

    const [existingUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser) {
        return c.json({ error: 'User not found' }, 404);
    }

    await db.update(users)
        .set({ name, departmentId, avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, id));

    const [updatedUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

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

    const [userToDelete] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!userToDelete) {
        return c.json({ error: 'User not found' }, 404);
    }

    await db.delete(users).where(eq(users.id, id));

    return c.json({ message: 'User deleted' });
});

export default app;
