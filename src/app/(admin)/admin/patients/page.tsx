"use client";

import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { UserProfile } from "@/types";
import { PatientsTable } from "@/components/admin/PatientsTable";
import { Loader2 } from "lucide-react";

export default function PatientsPage() {
    const [patients, setPatients] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await adminService.getAllPatients();
                setPatients(data);
            } catch (error) {
                console.error("Failed to fetch patients", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Directorio de Pacientes</h1>
                <p className="text-muted-foreground">Listado completo de pacientes registrados.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center border rounded-lg bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground ml-2">Cargando directorio...</p>
                </div>
            ) : (
                <PatientsTable data={patients} />
            )}
        </div>
    );
}
