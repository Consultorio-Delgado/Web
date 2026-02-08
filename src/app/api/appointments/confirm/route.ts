import { db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { appointmentId, patientToken } = body;

        if (!appointmentId || !patientToken) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos.' },
                { status: 400 }
            );
        }

        // 1. Fetch the appointment
        const appointmentRef = db.collection('appointments').doc(appointmentId);
        const appointmentSnap = await appointmentRef.get();

        if (!appointmentSnap.exists) {
            return NextResponse.json(
                { error: 'Turno no encontrado.' },
                { status: 404 }
            );
        }

        const appointment = appointmentSnap.data();

        // Ensure appointment data exists
        if (!appointment) {
            return NextResponse.json(
                { error: 'Turno no encontrado.' },
                { status: 404 }
            );
        }

        // 2. Validate token (patientId must match)
        if (appointment.patientId !== patientToken) {
            return NextResponse.json(
                { error: 'Token inválido.' },
                { status: 403 }
            );
        }

        // 3. Get doctor name for response
        let doctorName = "Su Profesional";
        try {
            const docSnap = await db.collection('doctors').doc(appointment.doctorId).get();
            if (docSnap.exists) {
                const docData = docSnap.data();
                doctorName = `${docData?.lastName}, ${docData?.firstName}`;
            }
        } catch (err) {
            console.error('[ConfirmAPI] Failed to fetch doctor:', err);
        }

        // Format date for response
        const appointmentDate = appointment.date.toDate();
        const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

        // 4. Check if already confirmed
        if (appointment.status === 'confirmed') {
            return NextResponse.json({
                code: 'ALREADY_CONFIRMED',
                message: 'Este turno ya fue confirmado.',
                appointment: {
                    patientName: appointment.patientName,
                    doctorName: doctorName,
                    date: formattedDate,
                    time: appointment.time
                }
            }, { status: 409 });
        }

        // 5. Update status to confirmed
        await appointmentRef.update({
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedVia: 'email_link'
        });

        return NextResponse.json({
            success: true,
            message: 'Turno confirmado exitosamente.',
            appointment: {
                patientName: appointment.patientName,
                doctorName: doctorName,
                date: formattedDate,
                time: appointment.time
            }
        });

    } catch (error) {
        console.error('[ConfirmAPI] Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
