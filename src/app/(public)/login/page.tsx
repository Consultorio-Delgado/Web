"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Middleware or AuthContext will handle redirect? 
            // Better to check role here or let the user choose where to go.
            // For now, redirect to portal.
            router.push("/portal");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Email o contraseña incorrectos.");
            } else {
                setError("Ocurrió un error al intentar ingresar.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            router.push("/portal");
        } catch (err: any) {
            console.error(err);
            setError("Error al ingresar con Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem-4rem)] bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Bienvenido</CardTitle>
                    <CardDescription className="text-center">
                        Ingresa a tu cuenta para gestionar tus turnos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.053-1.147 8.24-3.293 2.213-2.187 2.853-5.547 2.853-8.107 0-.587-.053-1.147-.133-1.68H12.48z" fill="#4285F4" /></svg>
                        )}
                        Continuar con Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                O con email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            Ingresar
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes cuenta?{" "}
                        <Link href="/register" className="text-primary hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
