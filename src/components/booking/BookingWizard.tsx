"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Doctor } from "@/types";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointments";
import { availabilityService } from "@/services/availabilityService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Clock, User as UserIcon, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function BookingWizard() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const rescheduleId = searchParams.get('reschedule');
    const preselectedDoctorId = searchParams.get('doctorId');

    const [step, setStep] = useState(1);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingProcessing, setBookingProcessing] = useState(false);

    // Load initial data and handle params
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await doctorService.getAllDoctors();
                setDoctors(data);

                // Handle preselection logic
                if (preselectedDoctorId) {
                    const doc = data.find(d => d.id === preselectedDoctorId);
                    if (doc) {
                        setSelectedDoctor(doc);
                        setStep(2); // Skip directly to Date selection
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar profesionales.");
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, [preselectedDoctorId]);

    // Fetch availability when Date/Doctor changes
    useEffect(() => {
        if ((step === 2 || step === 3) && selectedDoctor && selectedDate) {
            const fetchAvailability = async () => {
                setLoadingSlots(true);
                setAvailableSlots([]);
                try {
                    const busyAppointments = await appointmentService.getDoctorAppointmentsOnDate(selectedDoctor.id, selectedDate);
                    const slots = await availabilityService.getAvailableSlots(selectedDoctor, selectedDate, busyAppointments);
                    setAvailableSlots(slots);
                } catch (error) {
                    toast.error("Error retrieving availability.");
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchAvailability();
        }
    }, [selectedDoctor, selectedDate, step]);

    const handleDoctorSelect = (doc: Doctor) => {
        setSelectedDoctor(doc);
        setStep(2);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        setStep(3);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setStep(4);
    };

    const handleConfirmBooking = async () => {
        if (!user || !profile) {
            toast.error("Debes iniciar sesión para reservar.");
            router.push("/login?redirect=/portal/new-appointment");
            return;
        }
        if (!selectedDoctor || !selectedDate || !selectedTime) return;

        setBookingProcessing(true);
        try {
            // 1. Re-check availability (concurrency check)
            const busyAppointments = await appointmentService.getDoctorAppointmentsOnDate(selectedDoctor.id, selectedDate);
            const currentSlots = await availabilityService.getAvailableSlots(selectedDoctor, selectedDate, busyAppointments);

            if (!currentSlots.includes(selectedTime)) {
                toast.error("Lo sentimos, este turno acaba de ser reservado.");
                setAvailableSlots(currentSlots);
                setStep(3); // Go back to picking time
                return;
            }

            // 2. Create the appointment
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: user.uid,
                patientName: `${profile.firstName} ${profile.lastName}`,
                patientEmail: profile.email,
                doctorId: selectedDoctor.id,
                doctorName: `${selectedDoctor.lastName}, ${selectedDoctor.firstName}`,
                date: appointmentDate,
                time: selectedTime,
            });

            // 3. If rescheduling, cancel the old one
            if (rescheduleId) {
                await appointmentService.cancelAppointment(rescheduleId);
                toast.success("Turno reprogramado con éxito.");
            } else {
                toast.success("¡Turno confirmado con éxito!");
            }

            // 4. Show success screen (Email is handled by service)
            setStep(5);

        } catch (error) {
            console.error(error);
            toast.error("Error al confirmar el turno. Intente nuevamente.");
        } finally {
            setBookingProcessing(false);
        }
    };

    // --- Steps Render ---

    const renderStep1_Doctors = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold mb-4">1. Seleccione un Profesional</h2>
            {loadingDoctors ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map(doc => (
                        <Card
                            key={doc.id}
                            className="cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-row items-center p-4 space-x-4 bg-white"
                            onClick={() => handleDoctorSelect(doc)}
                        >
                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{doc.lastName}, {doc.firstName}</h3>
                                <Badge variant="secondary" className="mt-1">{doc.specialty}</Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStep2_Date = () => (
        <div className="space-y-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-xl font-semibold">2. Seleccione una Fecha</h2>
                <p className="text-muted-foreground mt-1">
                    Turnos disponibles para <span className="font-medium text-foreground">{selectedDoctor?.lastName}, {selectedDoctor?.firstName}</span>
                </p>
            </div>

            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                    }}
                    initialFocus
                    locale={es}
                    className="p-3 pointer-events-auto"
                />
            </div>
            <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
                Cambiar Profesional
            </Button>
        </div>
    );

    const renderStep3_Time = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">3. Seleccione un Horario</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="capitalize">{selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                </div>
            </div>

            {loadingSlots ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
            ) : availableSlots.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-lg bg-slate-50">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No hay turnos disponibles para esta fecha.</p>
                    <Button variant="link" onClick={() => setStep(2)} className="mt-2 text-blue-600">
                        Volver al calendario
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map(time => (
                        <Button
                            key={time}
                            variant="outline"
                            className="h-12 text-sm font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                            onClick={() => handleTimeSelect(time)}
                        >
                            {time}
                        </Button>
                    ))}
                </div>
            )}
            <Button variant="ghost" className="mt-6 w-full" onClick={() => setStep(2)}>
                Volver a fecha
            </Button>
        </div>
    );

    const renderStep4_Confirm = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2 mb-8">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-50 p-4 rounded-full">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Confirmar {rescheduleId ? 'Reprogramación' : 'Reserva'}</h2>
                <p className="text-muted-foreground">Verifique los datos antes de confirmar.</p>
            </div>

            <Card className="max-w-md mx-auto shadow-lg border-blue-100">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between border-b border-dashed pb-3">
                        <span className="text-muted-foreground">Doctor:</span>
                        <span className="font-medium text-right">{selectedDoctor?.lastName}, {selectedDoctor?.firstName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-3">
                        <span className="text-muted-foreground">Especialidad:</span>
                        <span className="font-medium text-right">{selectedDoctor?.specialty}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-3">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium capitalize text-right">{selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-3">
                        <span className="text-muted-foreground">Horario:</span>
                        <span className="font-medium text-right text-blue-600">{selectedTime} hs</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="text-muted-foreground">Paciente:</span>
                        <span className="font-medium text-right">{profile?.firstName} {profile?.lastName}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-slate-50/50 pt-6">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" onClick={handleConfirmBooking} disabled={bookingProcessing}>
                        {bookingProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {rescheduleId ? "Confirmar Cambio" : "Confirmar Reserva"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep(3)} disabled={bookingProcessing}>
                        Volver atrás
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );

    const renderStep5_Success = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">¡Todo listo!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-sm">
                Su turno ha sido {rescheduleId ? 'reprogramado' : 'reservado'} existosamente. Se ha enviado un correo con los detalles.
            </p>

            <Card className="w-full max-w-sm mb-8 border-green-100 bg-green-50/30">
                <CardContent className="pt-6 pb-6 space-y-1">
                    <p className="font-medium text-lg">{format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })} - {selectedTime} hs</p>
                    <p className="text-muted-foreground">Dr. {selectedDoctor?.lastName}</p>
                </CardContent>
            </Card>

            <Link href="/portal">
                <Button size="lg" className="px-8">
                    Ir a Mis Turnos
                </Button>
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4">
            {step === 1 && renderStep1_Doctors()}
            {step === 2 && renderStep2_Date()}
            {step === 3 && renderStep3_Time()}
            {step === 4 && renderStep4_Confirm()}
            {step === 5 && renderStep5_Success()}
        </div>
    );
}
