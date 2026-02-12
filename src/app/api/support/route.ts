import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; // Use admin SDK for server-side writes
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, pathname, userId, email, userAgent, ticketId } = body;

        if (!description || !pathname) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Save to Firestore using Admin SDK (bypasses security rules)
        const collectionName = ticketId?.startsWith('CRASH-') ? 'crash_reports' : 'support_tickets';
        const docRef = await db.collection(collectionName).add({
            description,
            pathname,
            userId: userId || null,
            email: email || null,
            userAgent,
            timestamp: FieldValue.serverTimestamp(),
        });

        const finalTicketId = ticketId || docRef.id;

        // 2. Send email notification
        const result = await emailService.sendBugReport({
            description,
            pathname,
            userId,
            email,
            userAgent,
            ticketId: finalTicketId
        });

        if (!result.success) {
            console.error('[API/Support] Email Error:', result.error);
            // We don't fail the whole request because the ticket was already saved to DB
        }

        return NextResponse.json({ success: true, ticketId: finalTicketId });
    } catch (error) {
        console.error('[API/Support] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
