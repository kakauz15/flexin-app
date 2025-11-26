import { Hono } from 'hono';
import { db } from '../db';
import { bookings } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const app = new Hono();

// Get all bookings (can be filtered by query params)
app.get('/', async (c) => {
    const allBookings = await db.select().from(bookings);
    return c.json(allBookings);
});

// Create a booking
app.post('/', async (c) => {
    const body = await c.req.json();
    const { userId, date, status, needsApproval } = body;

    const [result] = await db.insert(bookings).values({
        userId,
        date,
        status: status || 'confirmed',
        needsApproval: needsApproval || false,
    });

    return c.json({ id: result.insertId, message: 'Booking created' }, 201);
});

// Cancel a booking
app.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.delete(bookings).where(eq(bookings.id, id));
    return c.json({ message: 'Booking cancelled' });
});

// Approve a booking (Admin)
app.patch('/:id/approve', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.update(bookings)
        .set({ status: 'confirmed', needsApproval: false })
        .where(eq(bookings.id, id));
    return c.json({ message: 'Booking approved' });
});

// Reject a booking (Admin)
app.patch('/:id/reject', async (c) => {
    const id = parseInt(c.req.param('id'));
    // Rejecting usually means deleting or setting status to cancelled. 
    // Based on context logic "rejectBooking" removes it.
    await db.delete(bookings).where(eq(bookings.id, id));
    return c.json({ message: 'Booking rejected' });
});

export default app;
