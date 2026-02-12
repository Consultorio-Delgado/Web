import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, pathname, userId, email, userAgent, ticketId } = body;

        if (!description || !pathname || !ticketId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await emailService.sendBugReport({
            description,
            pathname,
            userId,
            email,
            userAgent,
            ticketId
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API/Support] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
