"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { adminService } from "@/services/adminService";
import { UserProfile } from "@/types";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { matchesSearchQuery } from "@/lib/utils";

interface PatientSearchProps {
    onSelect?: (patient: UserProfile) => void;
}

const getPatientSearchFields = (patient: UserProfile) => [
    patient.firstName,
    patient.lastName,
    `${patient.firstName} ${patient.lastName}`,
    `${patient.lastName} ${patient.firstName}`,
    `${patient.lastName}, ${patient.firstName}`,
    patient.dni || "",
    patient.email,
];

export function PatientSearch({ onSelect }: PatientSearchProps) {
    const router = useRouter();
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<UserProfile[]>([]);
    const [allPatients, setAllPatients] = useState<UserProfile[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);

    useEffect(() => {
        setLoadingPatients(true);
        adminService.getAllPatients()
            .then(setAllPatients)
            .catch((error) => {
                console.error(error);
                toast.error("Error al cargar pacientes");
            })
            .finally(() => setLoadingPatients(false));
    }, []);

    useEffect(() => {
        if (!term || term.length < 2) {
            setResults([]);
            return;
        }

        const found = allPatients
            .filter((patient) => matchesSearchQuery(getPatientSearchFields(patient), term))
            .slice(0, 20);

        setResults(found);
    }, [term, allPatients]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term || term.length < 2) return;

        if (results.length === 0) {
            toast.info("No se encontraron pacientes.");
        }
    };

    const handleSelect = (patient: UserProfile) => {
        if (onSelect) {
            onSelect(patient);
        } else {
            router.push(`/doctor/patient/${patient.uid}`);
        }
        setTerm("");
        setResults([]);
    };

    return (
        <div className="w-full max-w-md relative">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Buscar por nombre, DNI o email..."
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                />
                <Button type="submit" disabled={loadingPatients || term.length < 2}>
                    {loadingPatients ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </form>

            {results.length > 0 && (
                <Card className="absolute top-12 left-0 right-0 z-50 shadow-lg">
                    <CardContent className="p-2">
                        {results.map((patient) => (
                            <div
                                key={patient.uid}
                                className="p-2 hover:bg-slate-100 cursor-pointer rounded-md"
                                onClick={() => handleSelect(patient)}
                            >
                                <p className="font-medium">{patient.lastName}, {patient.firstName}</p>
                                <p className="text-xs text-muted-foreground">DNI: {patient.dni || "N/A"} - {patient.email}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
