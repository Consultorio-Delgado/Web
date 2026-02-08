"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { UserProfile } from "@/types";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface PatientSearchProps {
    onSelect?: (patient: UserProfile) => void;
}

export function PatientSearch({ onSelect }: PatientSearchProps) {
    const router = useRouter();
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!term) return;

        setSearching(true);
        setResults([]);
        try {
            // Ideally we should use a proper search index (Algolia/Typesense) or simple Firestore queries.
            // Firestore doesn't do "contains" easily. We'll do exact match on DNI or "prefix" on Name if possible, 
            // but for now let's try to match DNI or Name (case sensitive unfortunately in Firestore).
            // Let's rely on DNI for exactness and Name for equality.

            // Strategy: Search by DNI first.
            const dniQuery = query(collection(db, "users"), where("dni", "==", term));
            const dniSnap = await getDocs(dniQuery);

            let found = dniSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

            if (found.length === 0) {
                // Try by LastName (exact)
                const nameQuery = query(collection(db, "users"), where("lastName", "==", term));
                const nameSnap = await getDocs(nameQuery);
                found = nameSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            }

            // Client-side filter to ensure we only get patients, not doctors/admins
            found = found.filter(u => u.role === 'patient');

            setResults(found);
            if (found.length === 0) toast.info("No se encontraron pacientes.");

        } catch (error) {
            console.error(error);
            toast.error("Error al buscar.");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="w-full max-w-md relative">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Buscar por DNI o Apellido exacto..."
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                />
                <Button type="submit" disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </form>

            {results.length > 0 && (
                <Card className="absolute top-12 left-0 right-0 z-50 shadow-lg">
                    <CardContent className="p-2">
                        {results.map(patient => (
                            <div
                                key={patient.uid}
                                className="p-2 hover:bg-slate-100 cursor-pointer rounded-md"
                                onClick={() => {
                                    if (onSelect) {
                                        onSelect(patient);
                                    } else {
                                        router.push(`/doctor/patient/${patient.uid}`);
                                    }
                                }}
                            >
                                <p className="font-medium">{patient.lastName}, {patient.firstName}</p>
                                <p className="text-xs text-muted-foreground">DNI: {patient.dni}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
