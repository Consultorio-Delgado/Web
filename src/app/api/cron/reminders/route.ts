import { db } from '@/lib/firebaseAdmin';
import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';
import { addHours, format } from 'date-fns';
import { es } from 'date-fns/locale';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consultoriodelgado.com';

// Vercel Cron automatically sends a header to secure the endpoint.
export async function GET(request: Request) {
    // 0. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.warn('[Cron/ActionReminders] Running in DEV mode without strict auth check.');
    }

    try {
        // 1. Calculate window: 48 to 72 hours from now
        const now = new Date();
        const start48h = addHours(now, 48);
        const end72h = addHours(now, 72);

        console.log(`[Cron/ActionReminders] Running for window: ${start48h.toISOString()} to ${end72h.toISOString()}`);

        // 2. Query PENDING Appointments in the 48-72h window
        const snapshot = await db.collection('appointments')
            .where('date', '>=', start48h)
            .where('date', '<=', end72h)
            .where('status', '==', 'pending')
            .get();

        if (snapshot.empty) {
            console.log('[Cron/ActionReminders] No pending appointments found in window.');
            return NextResponse.json({ success: true, count: 0 });
        }

        console.log(`[Cron/ActionReminders] Found ${snapshot.size} pending appointments.`);

        let sentCount = 0;
        const errors: any[] = [];

        // 3. Iterate and Send Action Reminder Emails
        for (const doc of snapshot.docs) {
            const appointment = doc.data();
            const appointmentId = doc.id;

            // Skip blocked slots
            if (appointment.patientId === 'blocked') continue;

            // Get doctor name
            let doctorName = "Su Profesional";
            try {
                const docSnap = await db.collection('doctors').doc(appointment.doctorId).get();
                if (docSnap.exists) {
                    const docData = docSnap.data();
                    doctorName = `${docData?.lastName}, ${docData?.firstName}`;
                }
            } catch (err) {
                console.error(`[Cron/ActionReminders] Failed to fetch doctor for appt ${appointmentId}`, err);
            }

            if (appointment.patientEmail) {
                // Generate confirmation URL with token (patientId for validation)
                const confirmUrl = `${BASE_URL}/appointments/confirm?id=${appointmentId}&token=${appointment.patientId}`;

                // Format date nicely
                const appointmentDate = appointment.date.toDate();
                const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM", { locale: es });

                const result = await emailService.sendActionReminder({
                    to: appointment.patientEmail,
                    patientName: appointment.patientName,
                    doctorName: doctorName,
                    date: formattedDate,
                    time: appointment.time,
                    confirmUrl: confirmUrl
                });

                if (result.success) {
                    sentCount++;
                    console.log(`[Cron/ActionReminders] Sent to ${appointment.patientEmail}`);
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
        console.error('[Cron/ActionReminders] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
