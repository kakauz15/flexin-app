import { Hono } from 'hono';
import { db } from '../db';
import { swapRequests, bookings } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const app = new Hono();

// Get all swap requests
app.get('/', async (c) => {
    const allRequests = await db.select().from(swapRequests);
    return c.json(allRequests);
});

// Create a swap request
app.post('/', async (c) => {
    const body = await c.req.json();
    const { requesterId, targetUserId, requesterDate, targetDate, message } = body;

    const [result] = await db.insert(swapRequests).values({
        requesterId,
        targetUserId,
        requesterDate,
        targetDate,
        message,
        status: 'pending'
    });

    return c.json({ id: result.insertId, message: 'Swap request created' }, 201);
});

// Cancel a swap request
app.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.delete(swapRequests).where(eq(swapRequests.id, id));
    return c.json({ message: 'Swap request cancelled' });
});

// Respond to swap request
app.patch('/:id/respond', async (c) => {
    const id = parseInt(c.req.param('id'));
    const { approve } = await c.req.json();

    if (approve) {
        // Transaction to update swap request and swap bookings
        await db.transaction(async (tx) => {
            const [request] = await tx.select().from(swapRequests).where(eq(swapRequests.id, id));

            if (!request) throw new Error('Request not found');

            // Update request status
            await tx.update(swapRequests)
                .set({ status: 'approved' })
                .where(eq(swapRequests.id, id));

            // Swap bookings dates
            // Find requester booking
            const [requesterBooking] = await tx.select().from(bookings).where(
                and(
                    eq(bookings.userId, request.requesterId),
                    eq(bookings.date, request.requesterDate)
                )
            );

            // Find target booking
            const [targetBooking] = await tx.select().from(bookings).where(
                and(
                    eq(bookings.userId, request.targetUserId),
                    eq(bookings.date, request.targetDate)
                )
            );

            if (requesterBooking && targetBooking) {
                await tx.update(bookings)
                    .set({ date: request.targetDate })
                    .where(eq(bookings.id, requesterBooking.id));

                await tx.update(bookings)
                    .set({ date: request.requesterDate })
                    .where(eq(bookings.id, targetBooking.id));
            }
        });
        return c.json({ message: 'Swap request approved and bookings swapped' });
    } else {
        await db.update(swapRequests)
            .set({ status: 'rejected' })
            .where(eq(swapRequests.id, id));
        return c.json({ message: 'Swap request rejected' });
    }
});

export default app;
