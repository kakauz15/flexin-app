import { Hono } from 'hono';
import { db } from '../db';
import { appSettings, blockedDates, adminAnnouncements } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const app = new Hono();

// Get settings (aggregates settings, blocked dates, and active announcement)
app.get('/', async (c) => {
    const [settings] = await db.select().from(appSettings).limit(1);
    const dates = await db.select().from(blockedDates);
    const [announcement] = await db.select().from(adminAnnouncements)
        .where(eq(adminAnnouncements.active, true))
        .orderBy(desc(adminAnnouncements.createdAt))
        .limit(1);

    return c.json({
        ...settings,
        blockedDates: dates.map(d => d.date),
        adminAnnouncement: announcement
    });
});

// Update settings
app.patch('/', async (c) => {
    const body = await c.req.json();
    // Assuming there's only one settings row, or we create one if not exists
    const [existing] = await db.select().from(appSettings).limit(1);

    if (existing) {
        await db.update(appSettings).set(body).where(eq(appSettings.id, existing.id));
    } else {
        await db.insert(appSettings).values(body);
    }

    return c.json({ message: 'Settings updated' });
});

// Block a date
app.post('/blocked-dates', async (c) => {
    const { date } = await c.req.json();
    await db.insert(blockedDates).values({ date });
    return c.json({ message: 'Date blocked' });
});

// Unblock a date
app.delete('/blocked-dates/:date', async (c) => {
    const dateStr = c.req.param('date');
    // Drizzle date column expects a string in YYYY-MM-DD format or a Date object.
    // Since we are comparing, we should ensure it matches the DB format.
    // Using sql template might be safer or just passing the string if the driver handles it.
    // The error suggests type mismatch. Let's try casting to any or using sql.
    await db.delete(blockedDates).where(eq(blockedDates.date, dateStr as any));
    return c.json({ message: 'Date unblocked' });
});

// Set announcement
app.post('/announcements', async (c) => {
    const { message } = await c.req.json();
    // Deactivate previous announcements
    await db.update(adminAnnouncements).set({ active: false });

    const [result] = await db.insert(adminAnnouncements).values({
        message,
        active: true
    });

    return c.json({ id: result.insertId, message: 'Announcement set' });
});

// Clear announcement
app.delete('/announcements', async (c) => {
    await db.update(adminAnnouncements).set({ active: false });
    return c.json({ message: 'Announcements cleared' });
});

export default app;
