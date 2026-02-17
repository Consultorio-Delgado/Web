import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin"; // Use Admin SDK

export async function POST(request: Request) {
    try {
        const { dni } = await request.json();

        if (!dni) {
            return NextResponse.json({ error: "DNI is required" }, { status: 400 });
        }

        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("dni", "==", dni).limit(1).get();

        if (!snapshot.empty) {
            return NextResponse.json({ exists: true });
        }

        return NextResponse.json({ exists: false });

    } catch (error) {
        console.error("Error checking DNI:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
