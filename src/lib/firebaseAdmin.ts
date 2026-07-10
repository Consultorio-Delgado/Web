import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // IMPORTANT: Replace escaped newlines for Vercel support
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();
const auth = admin.auth();

export function isAuthUserNotFound(error: unknown): boolean {
    if (error === 'USER_NOT_FOUND') return true;
    if (!error || typeof error !== 'object') return false;

    const err = error as {
        code?: string;
        errorInfo?: { code?: string; message?: string };
        message?: string;
    };

    const code = err.code || err.errorInfo?.code;
    if (code === 'auth/user-not-found' || code === 'auth/email-not-found') {
        return true;
    }

    const message = err.message || err.errorInfo?.message || '';
    return /no user record|user not found|email not found/i.test(message);
}

export { db, auth };
