"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userService } from "@/services/user";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { PatientProfileFields } from "@/components/auth/PatientProfileFields";
import {
    emptyPatientProfileFormData,
    PatientProfileFormData,
    checkDniAvailable,
    validatePatientProfileForm,
} from "@/lib/patientProfileForm";

type RegisterFormData = PatientProfileFormData & {
    email: string;
    password: string;
    confirmPassword: string;
};

export default function RegisterPage() {
    const [formData, setFormData] = useState<RegisterFormData>({
        ...emptyPatientProfileFormData(),
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (value: string, id: keyof PatientProfileFormData) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

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

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            fetch("/api/emails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "verification",
                    data: {
                        to: formData.email,
                        patientName: formData.firstName,
                    },
                }),
            }).catch((err) => console.error("Failed to send verification email:", err));

            await userService.createUserProfile(user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: "patient",
                dni: formData.dni,
                phone: formData.phone,
                birthDate: formData.birthDate,
                insurance: formData.insuranceProvider,
                insuranceNumber: formData.insuranceNumber,
                ...(formData.plan ? { plan: formData.plan } : {}),
            });

            const token = await user.getIdToken();
            Cookies.set("session", token, { expires: 1, path: "/" });

            router.push("/portal?registered=true");
        } catch (err: unknown) {
            console.error(err);
            const firebaseErr = err as { code?: string };
            if (firebaseErr.code === "auth/email-already-in-use") {
                setError("El email ya está registrado.");
            } else if (firebaseErr.code === "auth/weak-password") {
                setError("La contraseña debe tener al menos 6 caracteres.");
            } else {
                setError("Ocurrió un error al registrarse. Intente nuevamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem-4rem)] bg-slate-50 p-4">
            <Card className="w-full max-w-md my-8">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
                    <CardDescription className="text-center">
                        Regístrate para gestionar tus turnos online
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <PatientProfileFields
                            formData={formData}
                            onChange={handleChange}
                            onSelectChange={handleSelectChange}
                            disabled={loading}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Contraseña <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput
                                id="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirmar Contraseña <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput
                                id="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm flex items-center gap-2 p-2 bg-red-50 rounded">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Cuenta
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Ingresa aquí
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
