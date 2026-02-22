"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INSURANCE_PROVIDERS } from "@/constants";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        dni: "",
        phone: "",
        birthDate: "",
        insuranceProvider: "",
        insuranceNumber: "",
        plan: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (value: string, id: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        if (!formData.insuranceProvider) {
            setError("Seleccione una Obra Social.");
            setLoading(false);
            return;
        }

        if (!formData.phone || formData.phone.length < 8) {
            setError("Ingrese un número de celular válido.");
            setLoading(false);
            return;
        }

        try {
            // 0. Validate Unique DNI
            const response = await fetch('/api/auth/check-dni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: formData.dni }),
            });

            if (!response.ok) {
                // Handle 500 or 400
                throw new Error("Error checking DNI");
            }

            const { exists } = await response.json();

            if (exists) {
                setError("Ya existe un usuario registrado con este documento de identidad.");
                setLoading(false);
                return;
            }

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 1b. Send Verification Email
            await sendEmailVerification(user);
            // toast.success("Cuenta creada. Enviamos un email de verificación."); // We don't have toast imported here yet? Let's check imports.

            // 2. Create Firestore Profile
            await userService.createUserProfile(user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: 'patient',
                dni: formData.dni,
                phone: formData.phone,
                birthDate: formData.birthDate,
                insurance: formData.insuranceProvider,
                insuranceNumber: formData.insuranceNumber,
                ...(formData.plan ? { plan: formData.plan } : {}),
            });

            // 3. Set Session Cookie (Manual sync to be safe, though AuthContext might do it too)
            const token = await user.getIdToken();
            Cookies.set("session", token, { expires: 1, path: '/' });

            // 4. Redirect
            // router.push("/portal"); // Let's adding a query param to show a specific welcome message?
            // "portal?registered=true"
            router.push("/portal?registered=true");

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("El email ya está registrado.");
            } else if (err.code === 'auth/weak-password') {
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre <span className="text-red-500">*</span></Label>
                                <Input id="firstName" required value={formData.firstName} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido <span className="text-red-500">*</span></Label>
                                <Input id="lastName" required value={formData.lastName} onChange={handleChange} disabled={loading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI <span className="text-red-500">*</span></Label>
                            <Input id="dni" type="number" required value={formData.dni} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Celular <span className="text-red-500">*</span></Label>
                            <Input
                                id="phone"
                                type="tel"
                                required
                                placeholder="Ej: 1123456789"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
                            <Input id="birthDate" type="date" required value={formData.birthDate} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="insuranceProvider">Obra Social / Prepaga <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => handleSelectChange(val, 'insuranceProvider')} value={formData.insuranceProvider}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {INSURANCE_PROVIDERS.map((ins) => (
                                        <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.insuranceProvider && formData.insuranceProvider !== 'PARTICULAR' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="insuranceNumber">Número de Credencial / Afiliado <span className="text-red-500">*</span></Label>
                                    <Input id="insuranceNumber" required value={formData.insuranceNumber} onChange={handleChange} disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan">Plan <span className="text-xs text-slate-400 font-normal">(opcional)</span></Label>
                                    <Input id="plan" placeholder="Ej: 310, 510, A1" value={formData.plan} onChange={handleChange} disabled={loading} />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input id="email" type="email" required value={formData.email} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña <span className="text-red-500">*</span></Label>
                            <PasswordInput id="password" required value={formData.password} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña <span className="text-red-500">*</span></Label>
                            <PasswordInput id="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} disabled={loading} />
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
