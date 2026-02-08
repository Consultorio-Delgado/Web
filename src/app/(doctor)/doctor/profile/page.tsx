"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doctorService } from "@/services/doctorService";
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { db, auth } from "@/lib/firebase"; // auth needed for password update
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { INSURANCE_PROVIDERS } from "@/constants";

export default function DoctorProfilePage() {
    const { user, profile } = useAuth();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [bio, setBio] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [gender, setGender] = useState<'male' | 'female'>("male");
    const [slotDuration, setSlotDuration] = useState(20);
    const [startHour, setStartHour] = useState("09:00");
    const [endHour, setEndHour] = useState("17:00");
    const [workDays, setWorkDays] = useState<number[]>([]);
    const [acceptedInsurances, setAcceptedInsurances] = useState<string[]>([]);
    const [maxDaysAhead, setMaxDaysAhead] = useState(30);
    const [exceptionalSchedule, setExceptionalSchedule] = useState<{ date: string; startHour: string; endHour: string }[]>([]);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // New state for adding exceptional day
    const [newExceptionalDate, setNewExceptionalDate] = useState("");
    const [newExceptionalStart, setNewExceptionalStart] = useState("09:00");
    const [newExceptionalEnd, setNewExceptionalEnd] = useState("17:00");

    useEffect(() => {
        const fetchDoctor = async () => {
            if (!user) return;
            try {
                let docData = await doctorService.getDoctorById(user.uid);

                if (docData) {
                    setDoctor(docData);
                    setBio(docData.bio || "");
                    setSpecialty(docData.specialty);
                    setGender(docData.gender || "male");
                    setSlotDuration(docData.slotDuration);
                    setStartHour(docData.schedule.startHour);
                    setEndHour(docData.schedule.endHour);
                    setWorkDays(docData.schedule.workDays);
                    setAcceptedInsurances(docData.acceptedInsurances || []);
                    setMaxDaysAhead(docData.maxDaysAhead || 30);
                    setExceptionalSchedule(docData.exceptionalSchedule || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (profile?.role === 'doctor') {
            fetchDoctor();
        } else {
            setLoading(false);
        }
    }, [user, profile]);

    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Complete todos los campos de contraseña");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Las nuevas contraseñas no coinciden");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setSaving(true);
        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, newPassword);

            toast.success("Contraseña actualizada correctamente");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error("La contraseña actual es incorrecta");
            } else {
                toast.error("Error al actualizar la contraseña");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!user || !profile) return;
        setSaving(true);
        try {
            const docId = doctor?.id || user.uid;

            const doctorData: Doctor = {
                id: docId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                specialty: specialty || "General",
                bio: bio,
                gender: gender,
                color: doctor?.color || "blue",
                slotDuration: slotDuration,
                schedule: {
                    startHour,
                    endHour,
                    workDays
                },
                acceptedInsurances: acceptedInsurances,
                maxDaysAhead: maxDaysAhead,
                exceptionalSchedule: exceptionalSchedule,
                ...(doctor?.imageUrl ? { imageUrl: doctor.imageUrl } : {}),
                ...(doctor?.email ? { email: doctor.email } : {})
            };

            await doctorService.createDoctor(doctorData);
            setDoctor(doctorData);
            toast.success("Perfil profesional actualizado.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar perfil.");
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: number) => {
        if (workDays.includes(day)) {
            setWorkDays(workDays.filter(d => d !== day));
        } else {
            setWorkDays([...workDays, day].sort());
        }
    };

    const toggleInsurance = (insurance: string) => {
        if (acceptedInsurances.includes(insurance)) {
            setAcceptedInsurances(acceptedInsurances.filter(i => i !== insurance));
        } else {
            setAcceptedInsurances([...acceptedInsurances, insurance]);
        }
    };

    const addExceptionalDay = () => {
        if (!newExceptionalDate) {
            toast.error("Seleccione una fecha");
            return;
        }
        // Validate date is not already added
        if (exceptionalSchedule.some(s => s.date === newExceptionalDate)) {
            toast.error("Ya existe una configuración para esta fecha");
            return;
        }

        // Add new exceptional day
        const newSchedule = [...exceptionalSchedule, {
            date: newExceptionalDate,
            startHour: newExceptionalStart,
            endHour: newExceptionalEnd
        }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setExceptionalSchedule(newSchedule);
        setNewExceptionalDate("");
        toast.success("Día excepcional agregado");
    };

    const removeExceptionalDay = (dateToRemove: string) => {
        setExceptionalSchedule(exceptionalSchedule.filter(s => s.date !== dateToRemove));
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (profile?.role !== 'doctor') {
        return <div className="p-8 text-center">No tienes permisos de doctor.</div>;
    }

    return (
        <div className="container max-w-3xl py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Perfil Profesional</h1>
                    <p className="text-muted-foreground">Administra tu información pública y horarios de atención.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Public Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Pública</CardTitle>
                        <CardDescription>Visible para los pacientes al reservar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={profile.firstName} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Apellido</Label>
                                <Input value={profile.lastName} disabled />
                            </div>
                        </div>

                        {/* Change Password Section */}
                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="font-semibold text-slate-900 mb-4">Seguridad</h3>
                            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            placeholder="••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            placeholder="••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Nueva</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            disabled={saving}
                                            onClick={handleChangePassword}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Actualizar Contraseña
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Especialidad</Label>
                            <Input
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                placeholder="Ej: Cardiología"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Biografía / Presentación</Label>
                            <Textarea
                                value={bio}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                                placeholder="Breve descripción de su trayectoria..."
                                className="h-24"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Insurance Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Obras Sociales Aceptadas</CardTitle>
                        <CardDescription>Active las coberturas con las que trabaja.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {INSURANCE_PROVIDERS.map((ins) => (
                                <div key={ins} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                    <Label htmlFor={`ins-${ins}`} className="font-medium text-slate-700 cursor-pointer flex-grow">
                                        {ins}
                                    </Label>
                                    <Switch
                                        id={`ins-${ins}`}
                                        checked={acceptedInsurances.includes(ins)}
                                        onCheckedChange={() => toggleInsurance(ins)}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 mt-4 bg-slate-50 p-3 rounded-md">
                            Nota: Los pacientes que filtren por una obra social que usted no acepte no verán su perfil en los resultados de búsqueda.
                        </p>
                    </CardContent>
                </Card>

                {/* Schedule Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Agenda y Horarios</CardTitle>
                        <CardDescription>Define tu disponibilidad semanal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hora Inicio</Label>
                                <Select value={startHour} onValueChange={setStartHour}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Inicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 13 }, (_, i) => i + 7).map(h => (
                                            <SelectItem key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                                                {h.toString().padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Hora Fin</Label>
                                <Select value={endHour} onValueChange={setEndHour}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Fin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 13 }, (_, i) => i + 10).map(h => (
                                            <SelectItem key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                                                {h.toString().padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duración del Turno (minutos)</Label>
                                <Select value={slotDuration.toString()} onValueChange={(v) => setSlotDuration(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Duración" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutos</SelectItem>
                                        <SelectItem value="20">20 minutos</SelectItem>
                                        <SelectItem value="30">30 minutos</SelectItem>
                                        <SelectItem value="40">40 minutos</SelectItem>
                                        <SelectItem value="60">60 minutos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Anticipación Máxima (días)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={maxDaysAhead}
                                    onChange={(e) => setMaxDaysAhead(parseInt(e.target.value) || 30)}
                                    placeholder="Ej: 30"
                                />
                                <p className="text-xs text-muted-foreground">Días futuros habilitados para reservar.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Días de Atención</Label>
                            <div className="flex flex-wrap gap-4">
                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`day-${idx}`}
                                            checked={workDays.includes(idx)}
                                            onCheckedChange={() => toggleDay(idx)}
                                        />
                                        <label
                                            htmlFor={`day-${idx}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {dayName}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button size="lg" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </div>
    );
}
