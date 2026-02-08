"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types";
import { Loader2 } from "lucide-react";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
    patient: UserProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditPatientDialog({ patient, open, onOpenChange, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dni: "",
        phone: "",
        email: "",
        insurance: "",
        insuranceNumber: "",
        birthDate: ""
    });

    useEffect(() => {
        if (patient) {
            setFormData({
                firstName: patient.firstName || "",
                lastName: patient.lastName || "",
                dni: patient.dni || "",
                phone: patient.phone || "",
                email: patient.email || "",
                insurance: patient.insurance || "",
                insuranceNumber: patient.insuranceNumber || "",
                birthDate: patient.birthDate || ""
            });
        }
    }, [patient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient) return;

        setLoading(true);
        try {
            await adminService.updatePatientProfile(patient.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dni: formData.dni,
                phone: formData.phone,
                insurance: formData.insurance,
                insuranceNumber: formData.insuranceNumber,
                birthDate: formData.birthDate // Assuming string YYYY-MM-DD
            });
            toast.success("Paciente actualizado correctamente");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar paciente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Paciente</DialogTitle>
                    <DialogDescription>Modifique los datos personales del paciente.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
                                value={formData.dni}
                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (No editable)</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-slate-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insurance">Obra Social</Label>
                        <Input
                            id="insurance"
                            value={formData.insurance}
                            onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                            placeholder="Ej. OSDE 210"
                        />
                    </div>

                    {/* New input field for insuranceNumber */}
                    <div className="space-y-2">
                        <Label htmlFor="insuranceNumber">Número de Afiliado</Label>
                        <Input
                            id="insuranceNumber"
                            value={formData.insuranceNumber}
                            onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                            placeholder="Ej: 123456789"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
