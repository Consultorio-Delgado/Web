"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, LogOut, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PatientProfileFields } from "@/components/auth/PatientProfileFields";
import {
    emptyPatientProfileFormData,
    PatientProfileFormData,
    checkDniAvailable,
    validatePatientProfileForm,
} from "@/lib/patientProfileForm";

export function CompleteProfileForm() {
    const { user, refreshProfile, logout } = useAuth();
    const [formData, setFormData] = useState<PatientProfileFormData>(emptyPatientProfileFormData());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (value: string, id: keyof PatientProfileFormData) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const validationError = validatePatientProfileForm(formData);
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const dniCheck = await checkDniAvailable(formData.dni);
            if (!dniCheck.ok) {
                setError(dniCheck.error);
                setLoading(false);
                return;
            }

            await userService.createUserProfile(user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: user.email || "",
                role: "patient",
                dni: formData.dni,
                phone: formData.phone,
                birthDate: formData.birthDate,
                insurance: formData.insuranceProvider,
                insuranceNumber: formData.insuranceNumber,
                ...(formData.plan ? { plan: formData.plan } : {}),
            });

            await refreshProfile();
            toast.success("Perfil completado. Ya podés reservar turnos.");
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al guardar tu perfil. Intentá nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem-4rem)] flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md my-8 shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserCircle className="h-7 w-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Completá tu perfil</CardTitle>
                    <CardDescription className="text-base text-slate-600">
                        Tu cuenta existe pero falta completar tus datos de paciente para reservar turnos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ""}
                                readOnly
                                disabled
                                className="bg-slate-50"
                            />
                        </div>

                        <PatientProfileFields
                            formData={formData}
                            onChange={handleChange}
                            onSelectChange={handleSelectChange}
                            disabled={loading}
                        />

                        {error && (
                            <div className="text-red-500 text-sm flex items-center gap-2 p-2 bg-red-50 rounded">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar y continuar
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button
                        variant="ghost"
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => logout()}
                        disabled={loading}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
