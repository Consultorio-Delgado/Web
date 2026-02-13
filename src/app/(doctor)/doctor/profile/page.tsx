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
import { Loader2, Save, Palmtree, Check, Megaphone, ChevronDown } from "lucide-react";
import { INSURANCE_PROVIDERS } from "@/constants";
import { settingsService, ClinicSettings } from "@/services/settingsService";

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
    const [schedulingMode, setSchedulingMode] = useState<'standard' | 'custom_bimonthly'>('standard');
    const [exceptionalSchedule, setExceptionalSchedule] = useState<{ date: string; startHour: string; endHour: string }[]>([]);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Vacation state
    const [vacationEnabled, setVacationEnabled] = useState(false);
    const [vacationStart, setVacationStart] = useState("");
    const [vacationEnd, setVacationEnd] = useState("");
    const [savingVacation, setSavingVacation] = useState(false);

    // New state for adding exceptional day
    const [newExceptionalDate, setNewExceptionalDate] = useState("");
    const [newExceptionalStart, setNewExceptionalStart] = useState("09:00");
    const [newExceptionalEnd, setNewExceptionalEnd] = useState("17:00");

    // Settings state (Global Announcement)
    const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);

    // Collapsible states
    const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [isVacationOpen, setIsVacationOpen] = useState(false);

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
                    // Force custom mode for Capparelli if not set, else use existing
                    const isCapparelli = docData.id === 'capparelli' || docData.lastName.toLowerCase().includes('capparelli');
                    setSchedulingMode(docData.schedulingMode || (isCapparelli ? 'custom_bimonthly' : 'standard'));
                    setExceptionalSchedule(docData.exceptionalSchedule || []);
                    setVacationEnabled(docData.vacationEnabled || false);
                    setVacationStart(docData.vacationStart || "");
                    setVacationEnd(docData.vacationEnd || "");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const settings = await settingsService.getSettings();
                setClinicSettings(settings);
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };

        if (profile?.role === 'doctor') {
            fetchDoctor();
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [user, profile]);

    // ... (handleChangePassword, handleSave, toggleDay, toggleInsurance remain unchanged)

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

    const handleSaveSchedule = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const doctorRef = doc(db, 'doctors', user.uid);
            await updateDoc(doctorRef, {
                schedule: {
                    startHour,
                    endHour,
                    workDays
                },
                slotDuration,
                maxDaysAhead,
                schedulingMode: schedulingMode || 'standard',
                exceptionalSchedule: exceptionalSchedule
            });
            toast.success("Agenda y horarios actualizados correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la agenda.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInsurances = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const doctorRef = doc(db, 'doctors', user.uid);
            await updateDoc(doctorRef, {
                acceptedInsurances
            });
            toast.success("Obras sociales actualizadas correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar obras sociales.");
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

    const handleSaveSettings = async () => {
        if (!clinicSettings) return;
        setSavingSettings(true);
        try {
            await settingsService.updateSettings(clinicSettings);
            toast.success("Anuncio global actualizado correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar anuncio.");
        } finally {
            setSavingSettings(false);
        }
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




                    </CardContent>
                </Card>

                {/* Schedule Configuration */}
                <Card>
                    <CardHeader
                        className="cursor-pointer flex flex-row items-center justify-between space-y-0"
                        onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                    >
                        <div className="space-y-1.5">
                            <CardTitle>Agenda y Horarios</CardTitle>
                            <CardDescription>Define tu disponibilidad semanal.</CardDescription>
                        </div>
                        <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform duration-200 ${isScheduleOpen ? 'rotate-180' : ''}`} />
                    </CardHeader>

                    {isScheduleOpen && (
                        <CardContent className="space-y-6 animate-in slide-in-from-top-2 duration-300">
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
                                    {schedulingMode === 'custom_bimonthly' ? (
                                        <div className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-100 text-slate-500 text-sm flex items-center cursor-not-allowed">
                                            Se abre el 1 y 15 de cada mes (Automático)
                                        </div>
                                    ) : (
                                        <Input
                                            type="number"
                                            min="1"
                                            value={maxDaysAhead}
                                            onChange={(e) => setMaxDaysAhead(parseInt(e.target.value) || 30)}
                                            placeholder="Ej: 30"
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {schedulingMode === 'custom_bimonthly'
                                            ? "Turnos se habilitan automáticamente cada 15 días."
                                            : "Días futuros habilitados para reservar."}
                                    </p>
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

                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 p-1 rounded">📅</span> Días Excepcionales / Adicionales
                                </h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    Agregue días específicos con horarios diferentes (o días que normalmente no atiende).
                                </p>

                                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <Input
                                            type="date"
                                            className="w-auto"
                                            value={newExceptionalDate}
                                            onChange={(e) => setNewExceptionalDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Select value={newExceptionalStart} onValueChange={setNewExceptionalStart}>
                                                <SelectTrigger className="w-[100px]">
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
                                            <span className="text-slate-400">-</span>
                                            <Select value={newExceptionalEnd} onValueChange={setNewExceptionalEnd}>
                                                <SelectTrigger className="w-[100px]">
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addExceptionalDay}
                                            className="ml-auto"
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Agregar Día
                                        </Button>
                                    </div>

                                    {exceptionalSchedule.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                            {exceptionalSchedule.map((day, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                    <div>
                                                        <span className="font-semibold text-slate-700 capitalize">
                                                            {new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className="mx-2 text-slate-300">|</span>
                                                        <span className="text-slate-600 font-mono">
                                                            {day.startHour} - {day.endHour}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeExceptionalDay(day.date)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                                    >
                                                        <span className="sr-only">Eliminar</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-slate-900 text-white"
                                onClick={handleSaveSchedule}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Agenda
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* Global Announcement Configuration */}
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader
                        className="cursor-pointer flex flex-row items-center justify-between space-y-0"
                        onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col space-y-1.5">
                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                    <Megaphone className="h-5 w-5" />
                                    Anuncio Global (Popup)
                                    {clinicSettings?.announcementEnabled ? (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full border border-green-200">
                                            ACTIVADO
                                        </span>
                                    ) : (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                                            desactivado
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-blue-600/80">
                                    Configuración visible para todos los pacientes al ingresar al sitio.
                                </CardDescription>
                            </div>
                        </div>
                        <ChevronDown className={`h-6 w-6 text-blue-400 transition-transform duration-200 ${isAnnouncementOpen ? 'rotate-180' : ''}`} />
                    </CardHeader>
                    {isAnnouncementOpen && (
                        <CardContent className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium text-blue-900">
                                            Estado del Anuncio
                                        </Label>
                                        <p className="text-sm text-blue-600/80">
                                            {clinicSettings?.announcementEnabled ? 'Activado (Visible)' : 'Desactivado (Oculto)'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={clinicSettings?.announcementEnabled || false}
                                        onCheckedChange={(checked) => setClinicSettings(prev => prev ? { ...prev, announcementEnabled: checked } : null)}
                                    />
                                </div>

                                {clinicSettings?.announcementEnabled && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                        <Label className="text-blue-900">Texto del Mensaje</Label>
                                        <Textarea
                                            placeholder="Ej: El consultorio permanecerá cerrado por vacaciones..."
                                            value={clinicSettings?.announcementText || ''}
                                            onChange={(e) => setClinicSettings(prev => prev ? { ...prev, announcementText: e.target.value } : null)}
                                            rows={3}
                                            className="resize-none focus-visible:ring-blue-400"
                                        />
                                        <p className="text-xs text-blue-400">
                                            Este mensaje aparecerá en una ventana emergente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings || !clinicSettings}
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Guardar Anuncio
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Vacation Configuration */}
                <Card>
                    <CardHeader
                        className="cursor-pointer flex flex-row items-center justify-between space-y-0"
                        onClick={() => setIsVacationOpen(!isVacationOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col space-y-1.5">
                                <CardTitle className="flex items-center gap-2">
                                    <Palmtree className="h-5 w-5 text-amber-500" />
                                    Vacaciones
                                    {vacationEnabled ? (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full border border-green-200">
                                            ACTIVADO
                                        </span>
                                    ) : (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                                            desactivado
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>Configurá tus períodos de vacaciones. Mientras estén activas, los pacientes no podrán enviar recetas, consultas virtuales ni estudios.</CardDescription>
                            </div>
                        </div>
                        <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform duration-200 ${isVacationOpen ? 'rotate-180' : ''}`} />
                    </CardHeader>
                    {isVacationOpen && (
                        <CardContent className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="vacation-toggle" className="font-medium text-slate-700 cursor-pointer">
                                    {vacationEnabled ? "🌴 Vacaciones ACTIVADAS" : "Vacaciones desactivadas"}
                                </Label>
                                <Switch
                                    id="vacation-toggle"
                                    checked={vacationEnabled}
                                    onCheckedChange={setVacationEnabled}
                                />
                            </div>

                            {vacationEnabled && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="space-y-2">
                                        <Label>Fecha de Inicio</Label>
                                        <Input
                                            type="date"
                                            value={vacationStart}
                                            onChange={(e) => setVacationStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fecha de Finalización</Label>
                                        <Input
                                            type="date"
                                            value={vacationEnd}
                                            onChange={(e) => setVacationEnd(e.target.value)}
                                            min={vacationStart}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-amber-700">
                                            ⚠️ Los pacientes verán que estás de vacaciones hasta el {vacationEnd ? new Date(vacationEnd + 'T12:00:00').toLocaleDateString('es-AR') : '...'} y no podrán enviar recetas, consultas virtuales ni estudios.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={async () => {
                                    if (vacationEnabled && (!vacationStart || !vacationEnd)) {
                                        toast.error("Completá las fechas de inicio y fin de vacaciones.");
                                        return;
                                    }
                                    setSavingVacation(true);
                                    try {
                                        const doctorRef = doc(db, 'doctors', user!.uid);
                                        await updateDoc(doctorRef, {
                                            vacationEnabled,
                                            vacationStart: vacationStart || null,
                                            vacationEnd: vacationEnd || null,
                                        });
                                        toast.success(vacationEnabled ? "Vacaciones activadas ✅" : "Vacaciones desactivadas");
                                    } catch (err) {
                                        console.error(err);
                                        toast.error("Error al guardar vacaciones");
                                    } finally {
                                        setSavingVacation(false);
                                    }
                                }}
                                disabled={savingVacation}
                                className={vacationEnabled ? "w-full bg-amber-600 hover:bg-amber-700 text-white" : "w-full"}
                            >
                                {savingVacation ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <><Check className="mr-2 h-4 w-4" /> Guardar Vacaciones</>
                                )}
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* Insurance Configuration */}
                <Card>
                    <CardHeader
                        className="cursor-pointer flex flex-row items-center justify-between space-y-0"
                        onClick={() => setIsInsuranceOpen(!isInsuranceOpen)}
                    >
                        <div className="space-y-1.5">
                            <CardTitle>Obras Sociales Aceptadas</CardTitle>
                            <CardDescription>Active las coberturas con las que trabaja.</CardDescription>
                        </div>
                        <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform duration-200 ${isInsuranceOpen ? 'rotate-180' : ''}`} />
                    </CardHeader>
                    {isInsuranceOpen && (
                        <CardContent className="animate-in slide-in-from-top-2 duration-300">
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
                            <p className="text-sm text-slate-500 mt-4 bg-slate-50 p-3 rounded-md mb-4">
                                Nota: Los pacientes que filtren por una obra social que usted no acepte no verán su perfil en los resultados de búsqueda.
                            </p>
                            <Button
                                className="w-full bg-slate-900 text-white"
                                onClick={handleSaveInsurances}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Obras Sociales
                            </Button>
                        </CardContent>
                    )}
                </Card>

            </div>
        </div>
    );
}
