import { db } from '@/lib/firebaseAdmin';
import { emailService } from '@/lib/email';
import { NextResponse } from 'next/server';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

// Daily reminder cron - runs at 17:00 ART (20:00 UTC)
// Sends reminders for appointments the DAY AFTER TOMORROW (pasado mañana)
export async function GET(request: Request) {
    // 0. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.warn('[Cron/DailyReminders] Running in DEV mode without strict auth check.');
    }

    try {
        // 1. Calculate "pasado mañana" in Argentina timezone (UTC-3)
        // This cron runs at 20:00 UTC = 17:00 ART
        const nowUTC = new Date();
        // Convert to Argentina time: UTC - 3 hours
        const argentinaOffset = -3 * 60 * 60 * 1000;
        const nowArgentina = new Date(nowUTC.getTime() + argentinaOffset);
        const dayAfterTomorrow = addDays(nowArgentina, 2); // pasado mañana
        const targetStart = startOfDay(dayAfterTomorrow);
        const targetEnd = endOfDay(dayAfterTomorrow);

        console.log(`[Cron/DailyReminders] Running at 17:00 ART. Checking appointments for: ${format(targetStart, 'yyyy-MM-dd')}`);

        // 2. Query appointments for pasado mañana (confirmed or pending, not blocked)
        const snapshot = await db.collection('appointments')
            .where('date', '>=', targetStart)
            .where('date', '<=', targetEnd)
            .get();

        if (snapshot.empty) {
            console.log('[Cron/DailyReminders] No appointments found for pasado mañana.');
            return NextResponse.json({ success: true, count: 0 });
        }

        // Filter: only confirmed/pending, not blocked, has email
        const validAppointments = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.patientId !== 'blocked' &&
                ['confirmed', 'pending'].includes(data.status) &&
                data.patientEmail;
        });

        console.log(`[Cron/DailyReminders] Found ${validAppointments.length} valid appointments to remind.`);

        let sentCount = 0;
        const errors: any[] = [];

        // 3. Send reminder to each patient
        for (const doc of validAppointments) {
            const appointment = doc.data();
            const appointmentId = doc.id;

            // Get doctor name
            let doctorName = "Su Profesional";
            try {
                const docSnap = await db.collection('doctors').doc(appointment.doctorId).get();
                if (docSnap.exists) {
                    const docData = docSnap.data();
                    doctorName = `${docData?.lastName}, ${docData?.firstName}`;
                }
            } catch (err) {
                console.error(`[Cron/DailyReminders] Failed to fetch doctor for appt ${appointmentId}`, err);
            }

            // Format date nicely
            const appointmentDate = appointment.date.toDate();
            const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM", { locale: es });

            const result = await emailService.sendReminder({
                to: appointment.patientEmail,
                patientName: appointment.patientName,
                doctorName: doctorName,
                date: formattedDate,
                time: appointment.time
            });

            if (result.success) {
                sentCount++;
                console.log(`[Cron/DailyReminders] Sent reminder to ${appointment.patientEmail} for ${appointment.time}`);
            } else {
                errors.push({ id: appointmentId, error: result.error });
                console.error(`[Cron/DailyReminders] Failed for ${appointment.patientEmail}`, result.error);
            }
        }

        console.log(`[Cron/DailyReminders] Complete. Sent: ${sentCount}/${validAppointments.length}`);

        return NextResponse.json({
            success: true,
            total: snapshot.size,
            eligible: validAppointments.length,
            sent: sentCount,
            errors
        });

    } catch (error) {
        console.error('[Cron/DailyReminders] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
