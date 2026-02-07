"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSent(true);
            toast.success("Correo de recuperación enviado.");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No existe un usuario con ese email.");
            } else {
                toast.error("Error al enviar el correo. Intente nuevamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Link
                href="/login"
                className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
            </Link>

            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingrese su email y le enviaremos un enlace para restablecer su contraseña.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSent ? (
                        <div className="text-center space-y-4">
                            <div className="text-green-600 font-medium">
                                ¡Listo! Revise su bandeja de entrada.
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Hemos enviado un enlace a <strong>{email}</strong>.
                            </p>
                            <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                                Probar con otro email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Enlace
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        ¿Ya tiene cuenta?{" "}
                        <Link href="/login" className="underline hover:text-primary">
                            Iniciar Sesión
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
