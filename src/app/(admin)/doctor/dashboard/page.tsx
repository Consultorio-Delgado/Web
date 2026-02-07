"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { appointmentService } from "@/services/appointments";
import { Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/doctor/PatientSearch";

export default function DoctorDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [date, setDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    // Note Dialog State
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // 1. Protection: Only for doctors
    useEffect(() => {
        if (!authLoading && (!user || profile?.role !== "doctor")) {
            // Redirect handled by middleware mostly, but just in case
        }
    }, [user, profile, authLoading, router]);

    // 2. Fetch appointments when date changes
    useEffect(() => {
        async function fetchAppts() {
            if (!user) return;
            setLoading(true);
            try {
                const data = await appointmentService.getDoctorAppointmentsOnDate(user.uid, date);
                setAppointments(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        if (user && profile?.role === "doctor") {
            fetchAppts();
        }
    }, [date, user, profile]);

    const handleSaveNote = async () => {
        if (!selectedAppointment) return;
        setIsSaving(true);
        try {
            await appointmentService.updateMedicalNotes(selectedAppointment.id, note);
            // Update local state
            setAppointments(prev => prev.map(a =>
                a.id === selectedAppointment.id ? { ...a, medicalNotes: note } : a
            ));
            setIsNoteDialogOpen(false);
        } catch (error) {
            console.error("Failed to save note", error);
            alert("Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!user || profile?.role !== "doctor") return <div className="p-8 text-center text-red-500">Access Denied. You must be a doctor to view this page.</div>;

    return (
        <div className="container py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Doctor Portal</h1>
                <p className="text-muted-foreground">Manage your daily schedule.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Calendar Picker */}
                <div className="md:col-span-4 lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Appointments List */}
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                    {/* Search Bar Area */}
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="text-sm font-medium text-blue-900">
                                Buscar Paciente
                            </div>
                            <PatientSearch />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Appointments for {format(date, "PPP", { locale: es })}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : appointments.length === 0 ? (
                                <p className="text-muted-foreground">No appointments scheduled for this day.</p>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.map((appt) => (
                                        <div key={appt.id} className={`flex items-center justify-between border p-4 rounded-lg transition-colors ${appt.status === 'arrived' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-card hover:bg-accent/50'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-lg">{appt.time} - {appt.patientName}</div>
                                                    {appt.status === 'arrived' && (
                                                        <span className="relative flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    Status:
                                                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${appt.status === 'arrived' ? 'bg-green-100 text-green-700' :
                                                        appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            appt.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {appt.status === 'arrived' ? 'En Espera (Llegó)' : appt.status}
                                                    </span>
                                                </div>
                                                {appt.medicalNotes && (
                                                    <div className="mt-2 text-sm bg-yellow-50/10 p-2 rounded border border-yellow-200/20">
                                                        <span className="font-medium text-yellow-600">Note:</span> {appt.medicalNotes}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/doctor/patient/${appt.patientId}`)}>
                                                    Historia
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAppointment(appt);
                                                        setNote(appt.medicalNotes || "");
                                                        setIsNoteDialogOpen(true);
                                                    }}
                                                >
                                                    {appt.medicalNotes ? "Edit Note" : "Add Note"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
                setIsNoteDialogOpen(open);
                if (!open) setSelectedAppointment(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Medical Note</DialogTitle>
                        <DialogDescription>
                            Add or update the evolution note for {selectedAppointment?.patientName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Escriba la evolución del paciente..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNote} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
