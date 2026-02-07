"use client";

import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// import { doctorsData } from "@/lib/doctorsData";

const INITIAL_DOCTORS: Doctor[] = [
    {
        id: "capparelli",
        firstName: "Javier",
        lastName: "Capparelli",
        specialty: "Clínica Médica",
        slotDuration: 20,
        color: "blue",
        schedule: { startHour: "09:00", endHour: "18:00", workDays: [1, 2, 3, 4, 5] }
    },
    {
        id: "secondi",
        firstName: "Ignacio",
        lastName: "Secondi",
        specialty: "Traumatología",
        slotDuration: 20,
        color: "green",
        schedule: { startHour: "14:00", endHour: "18:00", workDays: [1, 3, 5] }
    }
];

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

    const updateRole = async (role: 'admin' | 'doctor' | 'patient') => {
        if (!user) {
            setStatus("Error: No estás logueado.");
            return;
        }
        setStatus(`Changing role to ${role}...`);
        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: role,
                updatedAt: new Date()
            }, { merge: true });

            setStatus(`Success! You are now a ${role}. Refresh page to see changes.`);
        } catch (error) {
            console.error(error);
            setStatus("Error: " + JSON.stringify(error));
        }
    };

    const toggleAdminPermission = async () => {
        if (!user) return;
        setStatus("Toggling admin permission...");
        try {
            // We need to fetch current permissions first
            const { getDoc } = await import("firebase/firestore");
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);

            let currentPerms: string[] = [];
            if (snap.exists()) {
                currentPerms = snap.data().permissions || [];
            }

            let newPerms = [...currentPerms];
            if (newPerms.includes('admin')) {
                newPerms = newPerms.filter(p => p !== 'admin');
                setStatus("Admin permission REMOVED.");
            } else {
                newPerms.push('admin');
                setStatus("Admin permission GRANTED.");
            }

            await updateDoc(docRef, {
                permissions: newPerms
            });

        } catch (error) {
            console.error(error);
            setStatus("Error toggling permission: " + JSON.stringify(error));
        }
    };

    return (
        <div className="p-10 flex flex-col gap-8 items-center justify-center min-h-screen max-w-lg mx-auto text-center">
            <div>
                <h1 className="text-3xl font-bold mb-2">Database Seeder & Debug</h1>
                <p className="text-slate-500">Utilities for development and testing.</p>
            </div>

            <div className="space-y-4 w-full border p-6 rounded-xl bg-slate-50">
                <h2 className="font-semibold text-lg">1. Initialization</h2>
                <Button onClick={runSeed} className="w-full">Initialize / Reset Doctors</Button>
            </div>

            <div className="space-y-4 w-full border p-6 rounded-xl bg-slate-50">
                <h2 className="font-semibold text-lg">2. Role Management</h2>
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => updateRole('admin')}>Set Admin 👑</Button>
                    <Button variant="outline" onClick={() => updateRole('doctor')}>Set Doctor 🩺</Button>
                    <Button variant="outline" onClick={() => updateRole('patient')}>Set Patient 👤</Button>
                </div>

                <div className="pt-2 border-t mt-2">
                    <Button variant="secondary" onClick={toggleAdminPermission} className="w-full">
                        Toggle "Admin Access" Permission 🔓
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Allows Doctors/Patients to access Admin Panel without changing their main role.
                    </p>
                </div>
            </div>

            <p className="text-mono bg-slate-100 p-2 rounded">{status}</p>
            {user && <p className="text-xs text-slate-500">Logged in as: {user.email}</p>}
        </div>
    );
}
