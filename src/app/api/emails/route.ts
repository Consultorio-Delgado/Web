import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
        }

        let result;

        switch (type) {
            case 'confirmation':
                result = await emailService.sendConfirmation(data);
                break;
            case 'cancellation':
                result = await emailService.sendCancellation(data);
                break;
            case 'reminder':
                // Usually triggered by Cron, but can be manual
                result = await emailService.sendReminder(data);
                break;
            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
        }

        if (!result.success) {
            console.error('[API/Emails] Service Error:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API/Emails] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
