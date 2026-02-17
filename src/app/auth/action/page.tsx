"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";
import Link from "next/link";

function AuthActionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Firebase auth mode: 'resetPassword', 'recoverEmail', 'verifyEmail'
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    // Reset Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Generic State
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [actionType, setActionType] = useState<string | null>(null);

    useEffect(() => {
        if (!oobCode) {
            setError("Código inválido o faltante.");
            setVerifying(false);
            return;
        }

        if (mode === "resetPassword") {
            setActionType("resetPassword");
            verifyPasswordResetCode(auth, oobCode)
                .then((email) => {
                    setEmail(email);
                    setVerifying(false);
                })
                .catch((error) => {
                    console.error("Error verifying code:", error);
                    setError("El enlace ha expirado o ya fue utilizado. Solicitá uno nuevo.");
                    setVerifying(false);
                });
        } else if (mode === "verifyEmail") {
            setActionType("verifyEmail");
            // For email verification, we can apply the code immediately
            applyActionCode(auth, oobCode)
                .then(() => {
                    setSuccess(true);
                    setVerifying(false);
                })
                .catch((error) => {
                    console.error("Error verifying email:", error);
                    setError("El enlace de verificación es inválido o ha expirado.");
                    setVerifying(false);
                });
        } else {
            setError("Acción no soportada o enlace inválido.");
            setVerifying(false);
        }
    }, [mode, oobCode]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await confirmPasswordReset(auth, oobCode!, newPassword);
            setSuccess(true);
        } catch (err: any) {
            console.error("Error resetting password:", err);
            if (err.code === "auth/expired-action-code") {
                setError("El enlace ha expirado. Solicitá uno nuevo.");
            } else if (err.code === "auth/weak-password") {
                setError("La contraseña es muy débil. Usá al menos 6 caracteres.");
            } else {
                setError("Error al cambiar la contraseña. Intentá de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-slate-600">Procesando solicitud...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-md shadow-lg border-0">
                    <CardContent className="pt-10 pb-10 text-center">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>

                        {actionType === "verifyEmail" ? (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Email Verificado!</h2>
                                <p className="text-slate-600 mb-8 px-4">
                                    Tu cuenta ha sido verificada correctamente. Ya podés acceder a todos los servicios del portal.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Contraseña actualizada!</h2>
                                <p className="text-slate-600 mb-8 px-4">Tu contraseña fue cambiada exitosamente.</p>
                            </>
                        )}

                        <div className="space-y-3">
                            <Link href="/portal?verified=true">
                                <Button className="w-full h-12 text-lg rounded-full shadow-md bg-primary hover:bg-primary/90">
                                    Ir al Portal
                                </Button>
                            </Link>
                            {actionType === "resetPassword" && (
                                <Link href="/login" className="block text-sm text-slate-500 hover:text-primary mt-4">
                                    O ir al inicio de sesión
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-md shadow-lg border-red-100">
                    <CardContent className="pt-10 pb-10 text-center">
                        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Enlace inválido</h2>
                        <p className="text-slate-600 mb-8 px-4">{error}</p>
                        <Link href="/login">
                            <Button variant="outline" className="w-full h-12 rounded-full border-slate-300">
                                Volver al Inicio
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Default: Reset Password Form
    if (actionType === "resetPassword") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Nueva contraseña</CardTitle>
                        <CardDescription>
                            Ingresá tu nueva contraseña para <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva contraseña</Label>
                                <PasswordInput
                                    id="newPassword"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Repetí la contraseña"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            )}

                            <Button type="submit" className="w-full h-11" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    "Cambiar Contraseña"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AuthActionContent />
        </Suspense>
    );
}
