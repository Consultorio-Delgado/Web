
const admin = require('firebase-admin');

// Hardcoded creds from .env.local for this one-off script
// Process private key to handle newlines
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0DDrLsoLTLAMC\nLbkgH1ErTykcUFyVjzqjUojFwAR/rQxRQ9+jT8Sr927F1+2osdjaqKht57MgoCrH\nYbcdS4VlKTcJ5jstpHSQ1Yk3lsCPc7rF5Ypd/EmLcLNo2VZvn1p9D9B3ZVR6BhM/\n3H4IfoYus5ArJbf8MolQJ7ggr0I1jAUXTQ8iEp6WthvP+yEsslpuF0t9GlOgvW+o\nOst/yZFLhGgKS5EqVzS/e+wemGsyN04Z6ILQPPSvUEr96JXl+pDRzyddGyYcPKu8\nj5sEp6x1PyWTNC2JcMNLeK6DL8qzKy413+NOpiz7bQosBVjAJqrKi4WEojwnPgzB\nDHdSx8KjAgMBAAECggEABZM7XtiwObRrLhjBsBTy1nx6XBNrn9XyODceCmw1DMm2\n+pfiHOnOFTpxhlQhWnqR/x3/Ln1g4T8UaV1v5iBTM8a1muuIzukAvbC0XFxL/3p9\n62goLgYvNiTPPrfmzUi0l0VzbGm0K/Me4CNbuQzx6rr0rowEc8gSKGvnxQX9mYV8\nbDGdystnMlZ+Lp+8HUbNXAAhYnRhbadPFi8unIUbPpWgrhFq8qlR7RkqwMONQCpo\nRGnIRGWDU012uHtUKjvLt9pPhoeUFIx7OUcZ6v737DKsgfMzj7uDnZGSHZvdQASv\n+JxNAqMe3HC3fl/6tnBYQVU6N11PpJjQ9QAKMUXwQQKBgQDomXf7hEsAmiBQ//Gi\n4lmMNFQmpSr8ltWZ8OTfNoygvLRF2cPT38pqVYAZRUoNgAluR+EtS+V2mREeV0aP\n6ERFh+0VetuNsuN/u6lwydHiFgqJgPfFudjVPdv0K8XuTjL4lBAvczskgKqk2id8\nrRK4VHHb7uS+N4lTFzPHosG25QKBgQDGKU6aSt/sUPn5Q1k2AVESf2CShSBNBsj1\n/YZurbBauxuUb4I6lwwLM8UCX75NFHN0UkZSuBdGemTurRo0YqMKk3eCeLtlxHEV\nv1gjPL3f1qLcE55GeUFjqAnC2t04wDnPCOIrE5SOwiEZvpcUHcsc+PDYxj3JDJQR\nEP7NIAcy5wKBgCRxRxclFws1GrMWJqm6hQUufbDAWAfTKgxAbdt7FHVqm2QGRmQ/\nv9sBIlzTOlL7KH8ay/Do3z7BpKj4S5nobinmrgKbiSKeUH6GzHlbZYLiqSv6BNf5\n0js2wetzoENCBUJlEFQe3blOX24Mr/scsr4mnOA0gao70UwvanFw0qDxAoGAD6T3\nNasvnoKOGaW9h0v3UJSJ1Ud5U1tzxifr0xUXVTJsbP2YtHN0WfYOWa+hYIh6zPYp\n4yHxhHjpOwajiPs4j/8wcjaB5PjrTKI8nRuQiflyBhnuZvXvuaRskNuil3ZlmfjD\nkk8LbXHaFyQ63TW08Wad7R9JhXPexLIoy5z5tIUCgYEA5CIIdZinfH9ACV696+T0\nrpXjlxSaFNVXDjh3Cb2Ox0c6I4nA9gRIqBpth/0AfJnFxYT8CvVHJKFy4mWjN9Oi\nOwJCbkExHp3yR8cv+9iPeu5aAPG4R5580K2nuq0lelfNtSx7FNqboY+s9MP8ESUe\neTQuxHLeRfv8tesQohsh8t0=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "consultorio-delgado",
            clientEmail: "firebase-adminsdk-fbsvc@consultorio-delgado.iam.gserviceaccount.com",
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
