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
    const { requesterId, targetUserId, targetDate, message } = body;

    // Validate requester's booking count
    const requesterBookings = await db.select()
        .from(bookings)
        .where(eq(bookings.userId, requesterId));

    if (requesterBookings.length >= 2) {
        return c.json({
            error: 'Você já atingiu o limite de marcações. Cancele uma marcação existente antes de solicitar um novo dia.'
        }, 400);
    }

    const [result] = await db.insert(swapRequests).values({
        requesterId,
        targetUserId,
        requesterDate: null, // No longer required
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
        // Transaction to update swap request and transfer booking
        await db.transaction(async (tx) => {
            const [request] = await tx.select().from(swapRequests).where(eq(swapRequests.id, id));

            if (!request) throw new Error('Request not found');

            // Update request status
            await tx.update(swapRequests)
                .set({ status: 'approved' })
                .where(eq(swapRequests.id, id));

            // Transfer booking from target to requester
            // Find target user's booking for the requested date
            const [targetBooking] = await tx.select().from(bookings).where(
                and(
                    eq(bookings.userId, request.targetUserId),
                    eq(bookings.date, request.targetDate)
                )
            );

            if (targetBooking) {
                // Transfer ownership: update userId to requester
                await tx.update(bookings)
                    .set({ userId: request.requesterId })
                    .where(eq(bookings.id, targetBooking.id));
            }
        });
        return c.json({ message: 'Swap request approved and booking transferred' });
    } else {
        await db.update(swapRequests)
            .set({ status: 'rejected' })
            .where(eq(swapRequests.id, id));
        return c.json({ message: 'Swap request rejected' });
    }
});

export default app;
