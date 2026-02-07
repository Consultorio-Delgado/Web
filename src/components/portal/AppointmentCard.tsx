"use client";

import { Appointment } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Verify if I need to install this? Shadcn usually has it.
import { CalendarDays, Clock, User, AlertTriangle, FileText, Image as ImageIcon } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { appointmentService } from "@/services/appointments";
import { useRouter } from "next/navigation";

interface AppointmentCardProps {
    appointment: Appointment;
    onStatusChange: () => void; // Callback to refresh list
}

export function AppointmentCard({ appointment, onStatusChange }: AppointmentCardProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const router = useRouter();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
            case 'completed': return <Badge variant="secondary">Completado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await appointmentService.cancelAppointment(appointment.id);
            toast.success("Turno cancelado correctamente.");
            setIsCancelDialogOpen(false);
            onStatusChange();
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al cancelar el turno.");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReschedule = () => {
        // Redirigir al wizard preseleccionando doctor o simplemente al wizard
        // Ideally pass query params like ?reschedule=true&oldAppointmentId=...
        router.push(`/portal/new-appointment?reschedule=${appointment.id}&doctorId=${appointment.doctorId}`);
    };

    const isUpcoming = new Date(appointment.date) >= new Date();
    const canManage = isUpcoming && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-slate-800">
                        Dr. {appointment.doctorName || appointment.doctorId}
                    </h3>
                    {getStatusBadge(appointment.status)}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                        <CalendarDays className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm font-medium">
                            {format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Clock className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm font-medium">
                            {appointment.time} hs
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <User className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm">
                            {appointment.doctorId === 'capparelli' ? 'Clínica Médica' :
                                (appointment.doctorId === 'secondi' ? 'Traumatología' :
                                    (appointment.doctorName?.includes('Ginec') || (appointment as any).specialty === 'Ginecología' ? 'Ginecología' : 'Dermatología'))}
                            {/* Fallback logic preserved but improved visually */}
                        </span>
                    </div>
                </div>

                {canManage && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full border-slate-200 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50"
                                onClick={handleReschedule}
                            >
                                Reprogramar
                            </Button>

                            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 px-3">
                                        Cancelar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    {/* Dialog Content Preserved */}
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            Cancelar Turno
                                        </DialogTitle>
                                        <DialogDescription>
                                            ¿Está seguro que desea cancelar su turno con <strong>{appointment.doctorName || appointment.doctorId}</strong> el día <strong>{format(new Date(appointment.date), "d/MM", { locale: es })}</strong>?
                                            <br /><br />
                                            Esta acción no se puede deshacer.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Volver</Button>
                                        <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                                            {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Estudios
                            </h4>
                            {/* Attachments List */}
                            {appointment.attachments && appointment.attachments.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {appointment.attachments.map((file, idx) => (
                                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline p-2 bg-cyan-50/50 rounded-lg transition-colors">
                                            {file.type === 'pdf' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                                            <span className="truncate">{file.name}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                            <FileUpload
                                pathPrefix={`appointments/${appointment.id}`}
                                onUploadComplete={(url, file) => {
                                    appointmentService.addAttachment(appointment.id, {
                                        name: file.name,
                                        url: url,
                                        type: file.type.includes('pdf') ? 'pdf' : 'image'
                                    }).then(() => {
                                        onStatusChange();
                                        toast.success("Adjunto guardado");
                                    });
                                }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            {/* Removed CardFooter as buttons are moved inside */}
        </Card>
    );
}
