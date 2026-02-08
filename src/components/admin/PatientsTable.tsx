"use client";

import { useState } from "react";
import Link from "next/link";
import { UserProfile } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Edit } from "lucide-react";
import { EditPatientDialog } from "./EditPatientDialog";

interface Props {
    data: UserProfile[];
    onUpdate?: () => void;
}

export function PatientsTable({ data, onUpdate }: Props) {
    const [filter, setFilter] = useState("");
    const [editingPatient, setEditingPatient] = useState<UserProfile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const filteredData = data.filter((patient) => {
        const term = filter.toLowerCase();
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const dni = patient.dni ? patient.dni.toLowerCase() : "";
        const email = patient.email.toLowerCase();

        return fullName.includes(term) || dni.includes(term) || email.includes(term);
    });

    const handleEdit = (patient: UserProfile) => {
        setEditingPatient(patient);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, DNI o email..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Obra Social</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron pacientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((patient) => (
                                <TableRow key={patient.uid} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        {patient.lastName}, {patient.firstName}
                                    </TableCell>
                                    <TableCell>{patient.dni || "-"}</TableCell>
                                    <TableCell>{patient.email}</TableCell>
                                    <TableCell>{patient.insurance || "-"}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link href={`/doctor/patients/${patient.uid}`}>
                                            <Button variant="ghost" size="icon" title="Ver Historia Clínica">
                                                <FileText className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Editar Datos"
                                            onClick={() => handleEdit(patient)}
                                        >
                                            <Edit className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground">
                Mostrando {filteredData.length} de {data.length} pacientes.
            </div>

            <EditPatientDialog
                patient={editingPatient}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => {
                    if (onUpdate) onUpdate();
                }}
            />
        </div>
    );
}
