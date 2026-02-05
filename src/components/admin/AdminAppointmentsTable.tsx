"use client";

import { Appointment } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Check, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminService } from "@/services/adminService";
import { useState } from "react";
import { toast } from "sonner"; // Assuming Sonner is available, or use alert

interface Props {
    initialAppointments: Appointment[];
    onUpdate?: () => void;
}

export function AdminAppointmentsTable({ initialAppointments, onUpdate }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
        setLoadingId(id);
        try {
            await adminService.updateAppointmentStatus(id, status);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar estado");
        } finally {
            setLoadingId(null);
        }
    };

    if (initialAppointments.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay turnos para esta fecha.</div>;
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-900 border-b">
                    <tr>
                        <th className="p-4 font-medium">Hora</th>
                        <th className="p-4 font-medium">Paciente</th>
                        <th className="p-4 font-medium hidden md:table-cell">Doctor</th>
                        <th className="p-4 font-medium hidden md:table-cell">Fecha</th>
                        <th className="p-4 font-medium">Estado</th>
                        <th className="p-4 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {initialAppointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold font-mono text-slate-700">{appt.time}</td>
                            <td className="p-4">
                                <div className="font-medium">{appt.patientName}</div>
                                <div className="text-xs text-muted-foreground">{appt.patientEmail}</div>
                            </td>
                            <td className="p-4 hidden md:table-cell capitalize">Dr. {appt.doctorId}</td>
                            <td className="p-4 hidden md:table-cell text-muted-foreground">
                                {format(new Date(appt.date), "dd/MM/yyyy")}
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                        appt.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    {appt.status === 'confirmed' && <Check className="w-3 h-3 mr-1" />}
                                    {appt.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appt.id)}>
                                            Copiar ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'confirmed')} disabled={loadingId === appt.id}>
                                            <Check className="mr-2 h-4 w-4 text-green-600" /> Confirmar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'completed')} disabled={loadingId === appt.id}>
                                            <Check className="mr-2 h-4 w-4 text-blue-600" /> Marcar Asistió
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'cancelled')} disabled={loadingId === appt.id} className="text-red-600">
                                            <X className="mr-2 h-4 w-4" /> Cancelar Turno
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
