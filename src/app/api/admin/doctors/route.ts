import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, specialty, bio, slotDuration, schedule } = body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create User in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        // 2. Set Custom Claims
        await auth.setCustomUserClaims(userRecord.uid, { role: "doctor" });

        // 3. Create Doctor Profile in Firestore
        const doctorData = {
            id: userRecord.uid,
            email, // Store email for reference
            firstName,
            lastName,
            specialty: specialty || "General",
            bio: bio || "",
            slotDuration: slotDuration || 20,
            schedule: schedule || {
                startHour: "09:00",
                endHour: "17:00",
                workDays: [1, 2, 3, 4, 5] // Mon-Fri default
            },
            createdAt: new Date().toISOString()
        };

        await db.collection("doctors").doc(userRecord.uid).set(doctorData);

        // Also create a basic UserProfile to ensure they can log in and be recognized
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            role: "doctor",
            firstName,
            lastName,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, doctorId: userRecord.uid });
    } catch (error: any) {
        console.error("Error creating doctor:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
