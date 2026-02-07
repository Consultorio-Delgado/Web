"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { exceptionService } from "@/services/exceptionService";
import { DayOff } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DoctorExceptionsPage() {
    const { profile } = useAuth();
    const [exceptions, setExceptions] = useState<DayOff[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const fetchExceptions = async () => {
        if (!profile?.uid) return;
        try {
            const data = await exceptionService.getDoctorExceptions(profile.uid);
            setExceptions(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar días bloqueados");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExceptions();
    }, [profile?.uid]);

    const handleBlockDate = async () => {
        if (!selectedDate || !profile?.uid) return;

        const dateStr = format(selectedDate, "yyyy-MM-dd");

        // Check if already blocked
        if (exceptions.some(ex => ex.date === dateStr)) {
            toast.info("Este día ya está bloqueado");
            return;
        }

        try {
            await exceptionService.createException({
                date: dateStr,
                doctorId: profile.uid,
                reason: "Bloqueo manual",
            });
            toast.success("Día bloqueado correctamente");
            setSelectedDate(undefined);
            fetchExceptions();
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear el día");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await exceptionService.deleteException(id);
            toast.success("Desbloqueado correctamente");
            fetchExceptions();
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear");
        }
    };

    return (
        <div className="container py-10 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Ausencias</h1>
                <p className="text-muted-foreground">Bloquee los días en los que no atenderá consultas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bloquear Nuevo Día</CardTitle>
                        <CardDescription>Seleccione una fecha para bloquear su agenda.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                            disabled={(date) => date < new Date()}
                        />
                        <Button
                            onClick={handleBlockDate}
                            disabled={!selectedDate}
                            className="w-full"
                        >
                            Bloquear {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Días Bloqueados</CardTitle>
                        <CardDescription>Lista de sus excepciones vigentes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-4">Cargando...</div>
                        ) : exceptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-2">
                                <AlertCircle className="h-8 w-8 text-slate-300" />
                                <p>No hay días bloqueados</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {exceptions.map((ex) => (
                                    <li key={ex.id} className="flex justify-between items-center p-3 border rounded-md bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(new Date(ex.date + "T00:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{ex.reason}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(ex.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
