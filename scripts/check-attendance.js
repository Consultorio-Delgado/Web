const admin = require("firebase-admin");

try {
    require("dotenv").config({ path: ".env.local" });
} catch (_) {}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!privateKey) {
    console.error("FIREBASE_PRIVATE_KEY missing in .env.local");
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || "consultorio-delgado",
            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL ||
                "firebase-adminsdk-fbsvc@consultorio-delgado.iam.gserviceaccount.com",
            privateKey,
        }),
    });
}

const db = admin.firestore();
const ATTENDED = ["completed", "arrived", "in_consultation"];

function isPatient(a) {
    return a.patientId && a.patientId !== "blocked" && a.type !== "Bloqueado";
}

function slotKey(a) {
    const d = a.date.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${a.doctorId}|${y}-${m}-${day}|${a.time}`;
}

function slotDt(a) {
    const d = a.date.toDate();
    const [h, min] = a.time.split(":").map(Number);
    const dt = new Date(d);
    dt.setHours(h, min, 0, 0);
    return dt;
}

function computeAttendance(appts, doctorId) {
    const now = new Date();
    const bySlot = new Map();
    for (const a of appts) {
        if (doctorId && a.doctorId !== doctorId) continue;
        const dt = slotDt(a);
        if (dt >= now) continue;
        const key = slotKey(a);
        const list = bySlot.get(key) ?? [];
        list.push(a);
        bySlot.set(key, list);
    }

    let attended = 0;
    let absent = 0;
    let free = 0;
    let unresolved = 0;

    for (const list of bySlot.values()) {
        const patients = list.filter(isPatient);
        if (patients.length === 0) continue;
        if (patients.some((p) => ATTENDED.includes(p.status))) attended++;
        else if (patients.some((p) => p.status === "absent")) absent++;
        else if (patients.every((p) => p.status === "cancelled")) free++;
        else unresolved++;
    }

    const denom = attended + absent + free;
    const rate = denom > 0 ? Math.round((attended / denom) * 100) : 100;
    return { attended, absent, free, unresolved, rate, slots: denom };
}

async function main() {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const snap = await db
        .collection("appointments")
        .where("date", ">=", admin.firestore.Timestamp.fromDate(startMonth))
        .where("date", "<=", admin.firestore.Timestamp.fromDate(endMonth))
        .get();

    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("Total turnos mes:", docs.length);

    for (const id of ["capparelli", "secondi"]) {
        const stats = computeAttendance(docs, id);
        const total = docs.filter((d) => d.doctorId === id).length;
        console.log(`\n=== ${id} ===`);
        console.log("Turnos (docs):", total);
        console.log("Por casillero pasado:", stats);
        console.log(`Asistencia: ${stats.rate}% (${stats.attended}/${stats.slots})`);
    }
}

main().catch(console.error);
