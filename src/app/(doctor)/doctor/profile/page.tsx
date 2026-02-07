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
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function DoctorProfilePage() {
    const { user, profile } = useAuth();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [bio, setBio] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [slotDuration, setSlotDuration] = useState(20);
    const [startHour, setStartHour] = useState("09:00");
    const [endHour, setEndHour] = useState("17:00");
    const [workDays, setWorkDays] = useState<number[]>([]);

    useEffect(() => {
        const fetchDoctor = async () => {
            if (!user) return;
            // Strategy: We assume the doctor ID matches the User UID if we migrate fully.
            // But currently the seed uses 'capparelli', 'secondi'.
            // How do we link User -> Doctor?
            // Option A: UserProfile has a 'doctorId' field (cleanest).
            // Option B: We assume user.uid IS the doctorId (goal state).
            // Option C: We check if there's a doctor with ID == user.uid.

            // For this phase, let's try to find a doctor with the same ID as the user.
            // If not found, maybe he is using one of the legacy IDs? 
            // Let's assume for the "Make Me Doctor" flow, we create a doctor with the user's UID.

            try {
                let docData = await doctorService.getDoctorById(user.uid);

                if (!docData) {
                    // Try to find by email or other robust link? 
                    // No, let's prompt creation or handle legacy mapping if we had it.
                    // For now, if no doctor doc exists, we might need to initialize it.
                    // Let's initialize a draft if role is doctor
                }

                if (docData) {
                    setDoctor(docData);
                    setBio(docData.bio || "");
                    setSpecialty(docData.specialty);
                    setSlotDuration(docData.slotDuration);
                    setStartHour(docData.schedule.startHour);
                    setEndHour(docData.schedule.endHour);
                    setWorkDays(docData.schedule.workDays);
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
            setLoading(false); // Not a doctor
        }
    }, [user, profile]);

    const handleSave = async () => {
        if (!user || !profile) return;
        setSaving(true);
        try {
            // Upsert: update if exists, create if not (using user.uid as ID)
            const docId = doctor?.id || user.uid;

            const doctorData: Doctor = {
                id: docId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                specialty: specialty || "General",
                bio: bio,
                color: doctor?.color || "blue", // Default
                slotDuration: slotDuration,
                imageUrl: doctor?.imageUrl,
                schedule: {
                    startHour,
                    endHour,
                    workDays
                }
            };

            await doctorService.createDoctor(doctorData); // efficient upsert
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

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (profile?.role !== 'doctor') {
        return <div className="p-8 text-center">No tienes permisos de doctor.</div>;
    }

    return (
        <div className="container max-w-3xl py-8">
            <h1 className="text-3xl font-bold mb-2">Perfil Profesional</h1>
            <p className="text-muted-foreground mb-8">Administra tu información pública y horarios de atención.</p>

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

                        <div className="space-y-3">
                            <Label>Días de Atención</Label>
                            <div className="flex flex-wrap gap-4">
                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        {/* Skip Sunday (0) and Saturday (6) usually? No, let user choose */}
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
