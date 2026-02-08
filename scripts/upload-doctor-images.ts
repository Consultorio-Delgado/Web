/**
 * Script para subir las imágenes de perfil de doctores a Firebase Storage
 * y actualizar los documentos en Firestore con las URLs.
 * 
 * Ejecutar con: npx tsx scripts/upload-doctor-images.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
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
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
    });
}

const db = getFirestore();
const bucket = getStorage().bucket();

// Mapeo de archivos locales a doctores (por email para identificarlos)
const DOCTOR_IMAGES: { [email: string]: string } = {
    'turnosconsultoriodelgado+ger@gmail.com': 'Ger_perfil.jpeg',
    'turnosconsultoriodelgado+vero@gmail.com': 'Vero_perfil.jpeg',
};

async function uploadDoctorImages() {
    console.log('🚀 Subiendo imágenes de doctores a Firebase Storage...\n');

    const imagesDir = path.join(process.cwd(), 'public', 'assets', 'doctors');

    for (const [email, filename] of Object.entries(DOCTOR_IMAGES)) {
        const localPath = path.join(imagesDir, filename);

        // Verificar que el archivo existe
        if (!fs.existsSync(localPath)) {
            console.error(`❌ Archivo no encontrado: ${localPath}`);
            continue;
        }

        try {
            // 1. Buscar el doctor por email
            const doctorsSnapshot = await db.collection('doctors')
                .where('email', '==', email)
                .limit(1)
                .get();

            if (doctorsSnapshot.empty) {
                console.log(`⚠️  Doctor con email ${email} no encontrado, saltando...`);
                continue;
            }

            const doctorDoc = doctorsSnapshot.docs[0];
            const doctorId = doctorDoc.id;
            const doctorData = doctorDoc.data();

            console.log(`📤 Subiendo imagen para ${doctorData.firstName} ${doctorData.lastName}...`);

            // 2. Subir a Firebase Storage
            const storagePath = `doctors/${doctorId}/profile.jpg`;
            await bucket.upload(localPath, {
                destination: storagePath,
                metadata: {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000', // Cache 1 año
                }
            });

            // 3. Obtener URL pública
            const file = bucket.file(storagePath);
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

            // 4. Actualizar documento del doctor con la URL
            await db.collection('doctors').doc(doctorId).update({
                photoURL: publicUrl,
                updatedAt: new Date()
            });

            console.log(`✅ ${doctorData.firstName} ${doctorData.lastName}: ${publicUrl}`);

        } catch (error) {
            console.error(`❌ Error procesando ${email}:`, error);
        }
    }

    console.log('\n========================================');
    console.log('🎉 Proceso completado!');
    console.log('========================================');
    console.log('\nLas URLs de las imágenes ahora están en el campo "photoURL" de cada doctor.');
}

uploadDoctorImages().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
});
