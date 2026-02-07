"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, KeyRound, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { updatePassword, User } from "firebase/auth";

export default function ProfilePage() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();

    // Initials helper
    const getInitials = (first?: string, last?: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "U";
    };

    if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container py-8 max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                        {getInitials(profile?.firstName, profile?.lastName)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                    <p className="text-muted-foreground">Gestiona tu información personal y seguridad.</p>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Información Personal</TabsTrigger>
                    <TabsTrigger value="security">Seguridad</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <PersonalInfoForm
                        user={user}
                        profile={profile}
                        refreshProfile={refreshProfile}
                    />
                </TabsContent>

                <TabsContent value="security">
                    <ChangePasswordForm user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PersonalInfoForm({ user, profile, refreshProfile }: { user: User | null, profile: any, refreshProfile: () => Promise<void> }) {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
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
    );
}

function ChangePasswordForm({ user }: { user: User | null }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword(user, password);
            toast.success("Contraseña actualizada correctamente.");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Por seguridad, debe volver a iniciar sesión para cambiar su contraseña.");
            } else {
                toast.error("Error al actualizar la contraseña.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                    Ingrese su nueva contraseña.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Actualizar Contraseña
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
