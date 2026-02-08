"use client";

import { useEffect, useState } from "react";
import { Doctor } from "@/types";
import { doctorService } from "@/services/doctorService";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { toast } from "sonner"; // If you have it, else use alert

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInternalLoading, setIsInternalLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);

    const fetchDoctors = async () => {
        setLoading(true);
        const data = await doctorService.getAllDoctors();
        setDoctors(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleCreate = async (data: any) => {
        setIsInternalLoading(true);
        try {
            // Get the current user's ID token for authentication
            const { auth } = await import("@/lib/firebase");
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No estás autenticado");
            }
            const token = await user.getIdToken(); // Use existing token

            // Use API to create Auth User + Firestore Profile
            const response = await fetch("/api/admin/doctors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al crear doctor");
            }

            setDialogOpen(false);
            toast.success("Doctor creado exitosamente");
            fetchDoctors(); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al crear doctor");
        } finally {
            setIsInternalLoading(false);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingDoctor) return;
        setIsInternalLoading(true);
        try {
            await doctorService.updateDoctor(editingDoctor.id, data);
            setDialogOpen(false);
            setEditingDoctor(undefined);
            fetchDoctors();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar doctor");
        } finally {
            setIsInternalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este doctor?")) return;
        try {
            await doctorService.deleteDoctor(id);
            fetchDoctors();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    };

    const openCreateDialog = () => {
        setEditingDoctor(undefined);
        setDialogOpen(true);
    };

    const openEditDialog = (doc: Doctor) => {
        setEditingDoctor(doc);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Doctores</h1>
                    <p className="text-muted-foreground">Administración del staff médico.</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Doctor
                </Button>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Turnos (Min)</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : doctors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No hay doctores registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            doctors.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Stethoscope className="h-4 w-4 text-slate-500" />
                                        </div>
                                        {doc.lastName}, {doc.firstName}
                                    </TableCell>
                                    <TableCell>{doc.specialty}</TableCell>
                                    <TableCell>{doc.slotDuration} min</TableCell>
                                    <TableCell>
                                        {doc.schedule?.startHour} - {doc.schedule?.endHour}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(doc)}>
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDoctor ? "Editar Doctor" : "Nuevo Doctor"}</DialogTitle>
                        <DialogDescription>
                            Complete los datos del profesional.
                        </DialogDescription>
                    </DialogHeader>
                    <DoctorForm
                        defaultValues={editingDoctor}
                        onSubmit={editingDoctor ? handleUpdate : handleCreate}
                        loading={isInternalLoading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
