import { auth, db } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side endpoint to update a user's email in Firebase Auth.
 * Uses Admin SDK which can directly change the email without verification constraints.
 * After this, the client should send a new verification email.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid, newEmail } = body;

        if (!uid || !newEmail) {
            return NextResponse.json(
                { error: 'uid and newEmail are required' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!newEmail.includes('@') || !newEmail.includes('.')) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // 1. Update email in Firebase Auth (Admin SDK bypasses verification requirements)
        await auth.updateUser(uid, {
            email: newEmail,
            emailVerified: false, // Reset verification for the new email
        });

        // 2. Update email in Firestore users collection
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ email: newEmail });
        }

        return NextResponse.json({ success: true });
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
