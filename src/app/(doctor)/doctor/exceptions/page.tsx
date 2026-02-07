"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DayOff, Doctor } from "@/types";
import { exceptionService } from "@/services/exceptions";
import { doctorService } from "@/services/doctorService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ExceptionsPage() {
    const [exceptions, setExceptions] = useState<DayOff[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [date, setDate] = useState("");
    const [doctorId, setDoctorId] = useState("global");
    const [reason, setReason] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [exData, docData] = await Promise.all([
                exceptionService.getAll(),
                doctorService.getAllDoctors()
            ]);
            setExceptions(exData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setDoctors(docData);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) {
            toast.error("Seleccione una fecha.");
            return;
        }

        setSubmitting(true);
        try {
            await exceptionService.addDayOff({
                date,
                doctorId: doctorId === "global" ? undefined : doctorId,
                reason: reason || "No disponible"
            });
            toast.success("Día bloqueado correctamente.");
            setDate("");
            setReason("");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar excepción.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de desbloquear este día?")) return;
        try {
            await exceptionService.removeDayOff(id);
            toast.success("Excepción eliminada.");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar.");
        }
    };

    const getDoctorName = (id?: string) => {
        if (!id) return "Todos (Global)";
        const doc = doctors.find(d => d.id === id);
        return doc ? `Dr. ${doc.lastName}` : "Desconocido";
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Excepciones</h1>
                <p className="text-muted-foreground">Bloquea días festivos o licencias médicas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bloquear Fecha</CardTitle>
                        <CardDescription>Añade un nuevo día no laborable.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="doctor">Profesional</Label>
                                <Select value={doctorId} onValueChange={setDoctorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione alcance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Todos (Feriado Global)</SelectItem>
                                        {doctors.map(doc => (
                                            <SelectItem key={doc.id} value={doc.id}>
                                                Dr. {doc.lastName}, {doc.firstName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Motivo</Label>
                                <Input
                                    id="reason"
                                    placeholder="Ej: Feriado Nacional, Congreso, Licencia"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Agregar Bloqueo
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Días Bloqueados</CardTitle>
                        <CardDescription>Lista de excepciones activas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exceptions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                <CalendarOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No hay días bloqueados configurados.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Alcance</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exceptions.map((ex) => (
                                        <TableRow key={ex.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(ex.date + 'T00:00:00'), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${!ex.doctorId ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {getDoctorName(ex.doctorId)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{ex.reason}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(ex.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
