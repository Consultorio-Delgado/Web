import { db } from '@/lib/firebaseAdmin';
import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Vercel Cron automatically sends a header to secure the endpoint.
// In dev, you can just call it manually.
export async function GET(request: Request) {
    // 0. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow in development without secret for easier testing, OR enforce it.
        // For strict security:
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // In dev, we might just warn or proceed.
        console.warn('[Cron] Running in DEV mode without strict auth check.');
    }

    try {
        // 1. Calculate "Tomorrow"
        const tomorrow = addDays(new Date(), 1);
        const start = startOfDay(tomorrow);
        const end = endOfDay(tomorrow);

        console.log(`[Cron/Reminders] Running for date: ${start.toISOString()}`);

        // 2. Query Appointments for Tomorrow using Admin SDK (bypasses rules)
        const snapshot = await db.collection('appointments')
            .where('date', '>=', start)
            .where('date', '<=', end)
            .where('status', '==', 'confirmed')
            .get();

        if (snapshot.empty) {
            console.log('[Cron/Reminders] No appointments found for tomorrow.');
            return NextResponse.json({ success: true, count: 0 });
        }

        console.log(`[Cron/Reminders] Found ${snapshot.size} appointments.`);

        let sentCount = 0;
        const errors: any[] = [];

        // 3. Iterate and Send Emails
        // Note in a real large-scale app, we might use a queue (Inngest/bullmq)
        for (const doc of snapshot.docs) {
            const appointment = doc.data();
            const appointmentId = doc.id;

            // We need doctor details.
            // Optimization: Fetch all doctors once or cache them.
            // For now, fetch individually (N+1 but N is small for a clinic).
            let doctorName = "Su Profesional";
            try {
                const docSnap = await db.collection('doctors').doc(appointment.doctorId).get();
                if (docSnap.exists) {
                    const docData = docSnap.data();
                    doctorName = `${docData?.lastName}, ${docData?.firstName}`;
                }
            } catch (err) {
                console.error(`[Cron/Reminders] Failed to fetch doctor for appt ${appointmentId}`, err);
            }

            if (appointment.patientEmail) {
                const result = await emailService.sendReminder({
                    to: appointment.patientEmail,
                    patientName: appointment.patientName,
                    doctorName: doctorName,
                    date: appointment.date.toDate().toLocaleDateString(), // Firestore Admin returns Timestamp
                    time: appointment.time
                });

                if (result.success) {
                    sentCount++;
                } else {
                    errors.push({ id: appointmentId, error: result.error });
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: snapshot.size,
            sent: sentCount,
            errors
        });

    } catch (error) {
        console.error('[Cron/Reminders] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
