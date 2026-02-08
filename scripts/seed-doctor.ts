/**
 * Script de Seed para crear doctor inicial
 * Ejecutar con: npx ts-node scripts/seed-doctor.ts
 * O desde la terminal con: npm run seed:doctor
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();
const auth = getAuth();

// Doctor data
const DOCTOR_DATA = {
    email: 'turnosconsultoriodelgado+ger@gmail.com',
    password: 'admin123',
    firstName: 'Gerardo',
    lastName: 'Delgado',
    specialty: 'Medicina General',
    licenseNumber: 'MN-00001',
    phone: '+54 11 1234-5678',
    bio: 'Médico fundador del Consultorio Delgado. Especialista en medicina general con amplia experiencia.',
    acceptedInsurances: ['OSDE', 'Swiss Medical', 'Galeno', 'Medifé', 'Particular'],
    availability: {
        monday: { start: '09:00', end: '18:00', slotDuration: 30 },
        tuesday: { start: '09:00', end: '18:00', slotDuration: 30 },
        wednesday: { start: '09:00', end: '18:00', slotDuration: 30 },
        thursday: { start: '09:00', end: '18:00', slotDuration: 30 },
        friday: { start: '09:00', end: '14:00', slotDuration: 30 },
    },
    isActive: true,
    isDeleted: false,
};

async function seedDoctor() {
    console.log('🚀 Starting doctor seed...\n');

    try {
        // 1. Check if user already exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(DOCTOR_DATA.email);
            console.log(`✅ User already exists with UID: ${userRecord.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create new user
                userRecord = await auth.createUser({
                    email: DOCTOR_DATA.email,
                    password: DOCTOR_DATA.password,
                    displayName: `${DOCTOR_DATA.firstName} ${DOCTOR_DATA.lastName}`,
                    emailVerified: true,
                });
                console.log(`✅ Created new user with UID: ${userRecord.uid}`);
            } else {
                throw error;
            }
        }

        // 2. Set custom claims for doctor role
        await auth.setCustomUserClaims(userRecord.uid, { role: 'doctor' });
        console.log('✅ Set custom claims: role = doctor');

        // 3. Create/update doctor document in Firestore
        const doctorDoc = {
            id: userRecord.uid,
            email: DOCTOR_DATA.email,
            firstName: DOCTOR_DATA.firstName,
            lastName: DOCTOR_DATA.lastName,
            specialty: DOCTOR_DATA.specialty,
            licenseNumber: DOCTOR_DATA.licenseNumber,
            phone: DOCTOR_DATA.phone,
            bio: DOCTOR_DATA.bio,
            acceptedInsurances: DOCTOR_DATA.acceptedInsurances,
            availability: DOCTOR_DATA.availability,
            isActive: DOCTOR_DATA.isActive,
            isDeleted: DOCTOR_DATA.isDeleted,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('doctors').doc(userRecord.uid).set(doctorDoc, { merge: true });
        console.log('✅ Created doctor document in Firestore');

        // 4. Create user profile document
        const userProfile = {
            uid: userRecord.uid,
            email: DOCTOR_DATA.email,
            firstName: DOCTOR_DATA.firstName,
            lastName: DOCTOR_DATA.lastName,
            role: 'doctor',
            createdAt: new Date(),
        };

        await db.collection('users').doc(userRecord.uid).set(userProfile, { merge: true });
        console.log('✅ Created user profile in Firestore');

        console.log('\n========================================');
        console.log('🎉 Doctor seed completed successfully!');
        console.log('========================================');
        console.log(`\n📧 Email: ${DOCTOR_DATA.email}`);
        console.log(`🔑 Password: ${DOCTOR_DATA.password}`);
        console.log(`👤 Name: ${DOCTOR_DATA.firstName} ${DOCTOR_DATA.lastName}`);
        console.log(`🆔 UID: ${userRecord.uid}`);
        console.log('\n⚠️  Recuerda cambiar la contraseña después del primer login!');

    } catch (error) {
        console.error('❌ Error seeding doctor:', error);
        process.exit(1);
    }

    process.exit(0);
}

seedDoctor();
