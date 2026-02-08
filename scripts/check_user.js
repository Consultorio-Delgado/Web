
const admin = require('firebase-admin');

// Try to load .env.local if dotenv is available
try {
    require('dotenv').config({ path: '.env.local' });
} catch (e) {
    console.log("dotenv not found or .env.local missing. Ensure environment variables are set manually.");
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@consultorio-delgado.iam.gserviceaccount.com";
const projectId = process.env.FIREBASE_PROJECT_ID || "consultorio-delgado";

if (!privateKey) {
    console.error("ERROR: FIREBASE_PRIVATE_KEY environment variable is missing.");
    console.error("Please set it in .env.local or your environment.");
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function checkUser(uid) {
    console.log(`Checking UID: ${uid}`);

    // Check Users Collection
    const userDoc = await db.collection('users').doc(uid).get();
    console.log(`Users Collection: ${userDoc.exists ? 'FOUND' : 'NOT FOUND'}`);
    if (userDoc.exists) {
        console.log('User Data:', userDoc.data());
    }

    // Check Doctors Collection
    const doctorDoc = await db.collection('doctors').doc(uid).get();
    console.log(`Doctors Collection: ${doctorDoc.exists ? 'FOUND' : 'NOT FOUND'}`);
    if (doctorDoc.exists) {
        console.log('Doctor Data:', doctorDoc.data());
    }
}

// Ensure the UID matches what was in the screenshot or what the user is experiencing issues with.
// The user provided screenshot shows doc ID: c8mzideENPe3ESsXOhLVfKNqiOA3
checkUser('c8mzideENPe3ESsXOhLVfKNqiOA3').catch(console.error);
