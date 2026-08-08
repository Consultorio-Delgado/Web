import { auth, db } from '@/lib/firebaseAdmin';
import { emailService } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'arrived', 'in_consultation'];

/** Max age of auth_time (seconds) — requires recent reauth before email change */
const MAX_AUTH_AGE_SECONDS = 5 * 60;

/**
 * Server-side endpoint to update a user's email in Firebase Auth + Firestore
 * and sync patientEmail on future active appointments.
 * Requires a valid Firebase ID token matching the target uid,
 * with recent reauthentication (auth_time within MAX_AUTH_AGE_SECONDS).
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { uid, newEmail: rawEmail } = body;

        if (!uid || !rawEmail) {
            return NextResponse.json(
                { error: 'uid and newEmail are required' },
                { status: 400 }
            );
        }

        if (decodedToken.uid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Step-up: reject tokens without recent password reauth (client-only reauth is bypassable)
        const authTime = typeof decodedToken.auth_time === 'number' ? decodedToken.auth_time : 0;
        const authAgeSeconds = Math.floor(Date.now() / 1000) - authTime;
        if (authAgeSeconds < 0 || authAgeSeconds > MAX_AUTH_AGE_SECONDS) {
            return NextResponse.json(
                {
                    error: 'Se requiere reautenticación reciente. Ingresá tu contraseña e intentá de nuevo.',
                    code: 'reauth_required',
                },
                { status: 403 }
            );
        }

        const newEmail = String(rawEmail).trim().toLowerCase();

        if (!newEmail.includes('@') || !newEmail.includes('.')) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // 1. Update email in Firebase Auth (Admin SDK bypasses verification requirements)
        await auth.updateUser(uid, {
            email: newEmail,
            emailVerified: false,
        });

        // 2. Update email in Firestore users collection
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        let patientName = newEmail;
        if (userDoc.exists) {
            const userData = userDoc.data();
            const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim();
            if (fullName) patientName = fullName;
            await userRef.update({ email: newEmail });
        }

        // 3. Sync patientEmail on future active appointments
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const appointmentsSnap = await db.collection('appointments')
            .where('patientId', '==', uid)
            .where('date', '>=', Timestamp.fromDate(startOfToday))
            .get();

        let appointmentsUpdated = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (const doc of appointmentsSnap.docs) {
            const data = doc.data();
            if (!ACTIVE_STATUSES.includes(data.status)) continue;
            if (data.patientEmail === newEmail) continue;

            batch.update(doc.ref, { patientEmail: newEmail });
            appointmentsUpdated++;
            batchCount++;

            // Firestore batches max 500 ops
            if (batchCount >= 450) {
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        // 4. Send verification to the new email (server-side; client session may break after Auth email change)
        const emailResult = await emailService.sendVerificationEmail({
            to: newEmail,
            patientName,
        });

        if (!emailResult.success) {
            console.error('Email updated but verification send failed:', emailResult.error);
            return NextResponse.json({
                success: true,
                appointmentsUpdated,
                verificationSent: false,
                warning: 'Email actualizado, pero no se pudo enviar la verificación. Usá Reenviar desde el login.',
            });
        }

        return NextResponse.json({
            success: true,
            appointmentsUpdated,
            verificationSent: true,
        });
    } catch (error: any) {
        console.error('Error updating email:', error);

        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json(
                { error: 'Este email ya está en uso por otro usuario.' },
                { status: 409 }
            );
        }
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json(
                { error: 'El formato del email no es válido.' },
                { status: 400 }
            );
        }
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json(
                { error: 'Usuario no encontrado.' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Error al actualizar el email.' },
            { status: 500 }
        );
    }
}
