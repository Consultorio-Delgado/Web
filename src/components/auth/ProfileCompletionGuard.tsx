"use client";

import { useAuth } from "@/context/AuthContext";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface ProfileCompletionGuardProps {
    children: React.ReactNode;
}

export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
    const { user, profile, loading, profileChecked, error, refreshProfile } = useAuth();

    if (loading || (user && !profileChecked)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertCircle className="h-7 w-7 text-red-600" />
                        </div>
                        <CardTitle className="text-xl">Error al cargar tu perfil</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => refreshProfile()} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (user && profileChecked && !profile) {
        return <CompleteProfileForm />;
    }

    return <>{children}</>;
}
