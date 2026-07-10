"use client";

import { useState } from "react";
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
    const [emailNotFound, setEmailNotFound] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setEmailNotFound(false);
        try {
            const res = await fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'password_reset',
                    data: { to: email }
                })
            });

            if (res.ok) {
                setIsSent(true);
                toast.success("Correo de recuperación enviado.");
            } else if (res.status === 404) {
                const data = await res.json();
                if (data.error === 'USER_NOT_FOUND') {
                    setEmailNotFound(true);
                } else {
                    toast.error("Error al enviar el correo. Intente nuevamente.");
                }
            } else {
                toast.error("Error al enviar el correo. Intente nuevamente.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Error al enviar el correo. Intente nuevamente.");
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
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailNotFound(false);
                                    }}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Enlace
                            </Button>
                            {emailNotFound && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                                    <p>
                                        No encontramos una cuenta registrada con <strong>{email}</strong>.
                                    </p>
                                    <div className="flex flex-col gap-1 text-xs">
                                        <Link href="/register" className="underline hover:text-primary w-fit">
                                            Crear una cuenta con otro email
                                        </Link>
                                        <button
                                            type="button"
                                            className="underline hover:text-primary text-left w-fit"
                                            onClick={() => setEmailNotFound(false)}
                                        >
                                            Corregir el email si fue un error de tipeo
                                        </button>
                                    </div>
                                </div>
                            )}
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
