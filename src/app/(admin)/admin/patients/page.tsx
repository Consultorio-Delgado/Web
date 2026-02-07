"use client";

import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { PatientsTable } from "@/components/admin/PatientsTable";
import { Loader2, Download } from "lucide-react";

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

    const handleExport = () => {
        if (!patients.length) return;

        const headers = ["Nombre", "Apellido", "DNI", "Email", "Teléfono", "Obra Social"];
        const csvContent = [
            headers.join(","),
            ...patients.map(p => [
                `"${p.firstName}"`,
                `"${p.lastName}"`,
                `"${p.dni || ''}"`,
                `"${p.email}"`,
                `"${p.phone || ''}"`,
                `"${p.insurance || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Directorio de Pacientes</h1>
                    <p className="text-muted-foreground">Listado completo de pacientes registrados.</p>
                </div>
                <Button variant="outline" onClick={handleExport} disabled={loading || patients.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
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
