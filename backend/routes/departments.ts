import { Hono } from 'hono';
import { db } from '../db';
import { departments } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// List departments
app.get('/', async (c) => {
    const allDepartments = await db.select().from(departments);
    return c.json(allDepartments);
});

// Get department by id
app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const department = await db.select().from(departments).where(eq(departments.id, id)).get();

    if (!department) {
        return c.json({ error: 'Department not found' }, 404);
    }

    return c.json(department);
});

// Create department
app.post('/', async (c) => {
    const body = await c.req.json();
    const { name, description } = body;

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const newDept = await db.insert(departments).values({ name, description }).returning().get();
    return c.json(newDept, 201);
});

// Update department
app.put('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const { name, description } = body;

    const updatedDept = await db.update(departments)
        .set({ name, description, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning()
        .get();

    if (!updatedDept) {
        return c.json({ error: 'Department not found' }, 404);
    }

    return c.json(updatedDept);
});

// Delete department
app.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const deleted = await db.delete(departments).where(eq(departments.id, id)).returning().get();

    if (!deleted) {
        return c.json({ error: 'Department not found' }, 404);
    }

    return c.json({ message: 'Department deleted' });
});

export default app;
