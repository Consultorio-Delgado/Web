"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userService } from "@/services/user";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        birthDate: "",
        insuranceProvider: "",
        insuranceNumber: "",
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

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create Firestore Profile
            await userService.createUserProfile(user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: 'patient',
                dni: formData.dni,
                birthDate: formData.birthDate,
                insurance: formData.insuranceProvider,
                insuranceNumber: formData.insuranceNumber,
            });

            // 3. Set Session Cookie (Manual sync to be safe, though AuthContext might do it too)
            const token = await user.getIdToken();
            Cookies.set("session", token, { expires: 1, path: '/' });

            // 4. Redirect
            router.push("/portal");

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

    // Note: Google Register flow would need a separate step to collect DNI/Insurance if not present.
    // For now, we keep it simple, but strictly speaking we should redirect to a "Complete Profile" page.
    const handleGoogleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const user = result.user;

            // Check if profile exists, if not create it
            const existingProfile = await userService.getUserProfile(user.uid);

            if (!existingProfile) {
                // Infer names from Google Display Name
                const [firstName = "", lastName = ""] = (user.displayName || "").split(" ");

                await userService.createUserProfile(user.uid, {
                    firstName,
                    lastName,
                    email: user.email || "",
                    role: 'patient',
                    insurance: 'PARTICULAR', // Default fallback for Google Auth
                });
            }

            const token = await user.getIdToken();
            Cookies.set("session", token, { expires: 1, path: '/' });

            router.push("/portal");
        } catch (err: any) {
            console.error(err);
            setError("Error al registrarse con Google.");
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
                                <Label htmlFor="firstName">Nombre</Label>
                                <Input id="firstName" required value={formData.firstName} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido</Label>
                                <Input id="lastName" required value={formData.lastName} onChange={handleChange} disabled={loading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input id="dni" type="number" required value={formData.dni} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                            <Input id="birthDate" type="date" required value={formData.birthDate} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="insuranceProvider">Obra Social / Prepaga</Label>
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
                            <div className="space-y-2">
                                <Label htmlFor="insuranceNumber">Número de Credencial / Afiliado</Label>
                                <Input id="insuranceNumber" required value={formData.insuranceNumber} onChange={handleChange} disabled={loading} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={formData.email} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" required value={formData.password} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} disabled={loading} />
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
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                        </div>
                    </div>
                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleRegister} disabled={loading}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </Button>
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
