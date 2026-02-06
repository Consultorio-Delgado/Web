"use client";

import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

import { doctorsData } from "@/lib/doctorsData";

// Adapter to ensure data matches Firestore expectation if needed
// But doctorsData should align with Doctor type.
const INITIAL_DOCTORS = doctorsData;

export default function SeedPage() {
    const [status, setStatus] = useState("Idle");
    const { user } = useAuth();

    const runSeed = async () => {
        setStatus("Seeding...");
        try {
            for (const doctor of INITIAL_DOCTORS) {
                // Ensure plain object for Firestore
                await setDoc(doc(db, "doctors", doctor.id), { ...doctor });
            }
            setStatus("Success! Doctors added.");
        } catch (error) {
            console.error(error);
            setStatus("Error: " + JSON.stringify(error));
        }
    };

    const makeMeAdmin = async () => {
        if (!user) {
            setStatus("Error: No estás logueado.");
            return;
        }
        setStatus("Updating role...");
        try {
            // Use setDoc with merge: true to CREATE the doc if it doesn't exist
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: 'admin',
                updatedAt: new Date()
            }, { merge: true });

            setStatus("Success! You are now an Admin. Refresh page to see changes.");
        } catch (error) {
            console.error(error);
            setStatus("Error: " + JSON.stringify(error));
        }
    };

    return (
        <div className="p-10 flex flex-col gap-4 items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Database Seeder</h1>

            <div className="flex gap-4">
                <Button onClick={runSeed}>Run Doctor Seed</Button>
                <Button variant="destructive" onClick={makeMeAdmin}>Make Me Admin 👑</Button>
            </div>

            <p className="text-mono bg-slate-100 p-2 rounded">{status}</p>
            {user && <p className="text-xs text-slate-500">Logged in as: {user.email}</p>}
        </div>
    );
}
