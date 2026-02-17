"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, LogOut, Loader2 } from "lucide-react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EmailVerificationGuardProps {
    children: React.ReactNode;
}

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
    const { user, loading, logout } = useAuth();
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // 1. Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 2. No User -> Redirect to Login (handled by Middleware usually, but safe to have here)
    if (!user) {
        // middleware should handle this, but if we are here without user, render nothing or redirect
        return null;
    }

    // 3. User Verified -> Render Children
    if (user.emailVerified) {
        return <>{children}</>;
    }

    // 4. User Not Verified -> Show Blocking UI
    const handleResend = async () => {
        setSending(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                toast.success("Email de verificación reenviado. Revisá tu bandeja de entrada (y spam).");
            }
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/too-many-requests') {
                toast.error("Demasiados intentos. Esperá unos minutos.");
            } else {
                toast.error("Error al enviar el email.");
            }
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                // Force a re-render/check by updating checking state or relying on AuthContext update?
                // AuthContext listens to onAuthStateChanged, but reload() might not trigger it unless token changes?
                // Actually reload() updates the currentUser object. We might need to force a refresh in AuthContext or just reload page.
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar estado.");
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl">Verificá tu Email</CardTitle>
                    <CardDescription className="text-base text-slate-600 mt-2">
                        Para proteger tu seguridad y la de tus datos médicos, necesitamos que verifiques tu dirección de correo:
                        <br />
                        <span className="font-medium text-slate-900 block mt-1">{user.email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                        <p>
                            <strong>1.</strong> Revisá tu bandeja de entrada (y Spam).
                            <br />
                            <strong>2.</strong> Hacé clic en el enlace de verificación.
                            <br />
                            <strong>3.</strong> Volvé acá y presioná "Ya lo verifiqué".
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            onClick={handleRefresh}
                            className="w-full h-11 text-base"
                            disabled={refreshing}
                        >
                            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Ya lo verifiqué
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleResend}
                            disabled={sending}
                            className="w-full"
                        >
                            {sending ? "Enviando..." : "Reenviar Email"}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="justify-center pt-2">
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => logout()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
