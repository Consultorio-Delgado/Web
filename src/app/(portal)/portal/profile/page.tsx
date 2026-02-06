"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is installed as per package.json

export default function ProfilePage() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        phone: "",
        insurance: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                phone: profile.phone || "",
                insurance: profile.insurance || "",
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            await userService.updateUserProfile(user.uid, {
                phone: formData.phone,
                insurance: formData.insurance,
            });
            await refreshProfile();
            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container py-8 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Mi Perfil</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                        Actualiza tus datos de contacto y obra social.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre</Label>
                                <Input id="firstName" value={profile?.firstName || ""} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido</Label>
                                <Input id="lastName" value={profile?.lastName || ""} disabled className="bg-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input id="dni" value={profile?.dni || ""} disabled className="bg-muted" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono / Celular</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Ej: 11 1234-5678"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="insurance">Obra Social / Prepaga</Label>
                            <Input
                                id="insurance"
                                value={formData.insurance}
                                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                                placeholder="Ej: OSDE 210"
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
