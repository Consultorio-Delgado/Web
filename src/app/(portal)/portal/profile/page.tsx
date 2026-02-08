"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, KeyRound, User as UserIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { updatePassword, User } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INSURANCE_PROVIDERS } from "@/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";

// Schema Validation
const profileSchema = z.object({
    phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
    birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Ingrese una fecha válida"),
    insurance: z.string().min(1, "Seleccione una obra social"),
    insuranceNumber: z.string().optional(),
}).refine((data) => {
    if (data.insurance !== "PARTICULAR" && (!data.insuranceNumber || data.insuranceNumber.length < 3)) {
        return false;
    }
    return true;
}, {
    message: "El número de credencial es obligatorio",
    path: ["insuranceNumber"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            phone: "",
            birthDate: "",
            insurance: "",
            insuranceNumber: "",
        },
    });

    useEffect(() => {
        if (profile) {
            // Ensure the insurance value is valid, otherwise default to "PARTICULAR"
            // Cast to readonly string[] to allow checking generic strings
            const insuranceValue = profile.insurance;
            const validInsurance = (INSURANCE_PROVIDERS as readonly string[]).includes(insuranceValue || "")
                ? insuranceValue
                : "PARTICULAR";

            // Use setValue to ensure the form updates even if reset behaves unexpectedly
            form.setValue("phone", profile.phone || "");
            form.setValue("birthDate", profile.birthDate || "");
            form.setValue("insurance", validInsurance || "PARTICULAR");
            form.setValue("insuranceNumber", profile.insuranceNumber || "");
        }
    }, [profile, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setIsSaving(true);
        try {
            await userService.updateUserProfile(user.uid, {
                phone: data.phone,
                birthDate: data.birthDate,
                insurance: data.insurance,
                insuranceNumber: data.insuranceNumber,
            });
            await refreshProfile();
            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const watchedInsurance = form.watch("insurance");

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
                <CardDescription>
                    Mantén tu información actualizada para una mejor atención.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Read-Only Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Datos de Identidad (No editables)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Email</Label>
                                <div className="font-medium text-sm text-slate-700">{profile?.email}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">DNI</Label>
                                <div className="font-medium text-sm text-slate-700">{profile?.dni || "No registrado"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Nombre</Label>
                                <div className="font-medium text-sm text-slate-700">{profile?.firstName}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Apellido</Label>
                                <div className="font-medium text-sm text-slate-700">{profile?.lastName}</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Editable Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Información de Contacto y Cobertura</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono / Celular</Label>
                                <Input
                                    id="phone"
                                    {...form.register("phone")}
                                    className={form.formState.errors.phone ? "border-red-500" : ""}
                                />
                                {form.formState.errors.phone && (
                                    <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                                <Input
                                    id="birthDate"
                                    type="date"
                                    {...form.register("birthDate")}
                                    className={form.formState.errors.birthDate ? "border-red-500" : ""}
                                />
                                {form.formState.errors.birthDate && (
                                    <p className="text-xs text-red-500">{form.formState.errors.birthDate.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="insurance">Obra Social / Prepaga</Label>
                                <Select
                                    key={watchedInsurance}
                                    onValueChange={(val) => form.setValue("insurance", val)}
                                    value={watchedInsurance}
                                >
                                    <SelectTrigger className={form.formState.errors.insurance ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Seleccione su cobertura" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INSURANCE_PROVIDERS.map((ins) => (
                                            <SelectItem key={ins} value={ins}>
                                                {ins}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.insurance && (
                                    <p className="text-xs text-red-500">{form.formState.errors.insurance.message}</p>
                                )}
                            </div>

                            {watchedInsurance !== "PARTICULAR" && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                    <Label htmlFor="insuranceNumber">Número de Credencial / Afiliado</Label>
                                    <Input
                                        id="insuranceNumber"
                                        {...form.register("insuranceNumber")}
                                        placeholder="Ej: 1234567890"
                                        className={form.formState.errors.insuranceNumber ? "border-red-500" : ""}
                                    />
                                    {form.formState.errors.insuranceNumber && (
                                        <p className="text-xs text-red-500">{form.formState.errors.insuranceNumber.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Cambios
                                </>
                            )}
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
                    Ingrese su nueva contraseña para mantener su cuenta segura.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <PasswordInput
                            id="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                        <PasswordInput
                            id="confirm-password"
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
