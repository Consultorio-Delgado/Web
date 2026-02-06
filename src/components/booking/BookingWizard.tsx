"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Doctor } from "@/types";
import { doctorService } from "@/services/doctors";
import { appointmentService } from "@/services/appointments";
import { availabilityService } from "@/services/availabilityService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Clock, User as UserIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function BookingWizard() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingProcessing, setBookingProcessing] = useState(false);

    // Step 1: Fetch Doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await doctorService.getAll();
                setDoctors(data);
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar profesionales.");
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // Step 3: Fetch Availability when Date/Doctor changes
    useEffect(() => {
        if (step === 3 && selectedDoctor && selectedDate) {
            const fetchAvailability = async () => {
                setLoadingSlots(true);
                setAvailableSlots([]);
                try {
                    // 1. Get busy appointments
                    const busyAppointments = await appointmentService.getDoctorAppointmentsOnDate(selectedDoctor.id, selectedDate);
                    // 2. Calculate free slots
                    const slots = availabilityService.getAvailableSlots(selectedDoctor, selectedDate, busyAppointments);
                    setAvailableSlots(slots);
                } catch (error) {
                    console.error(error);
                    toast.error("Error al calcular horarios.");
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchAvailability();
        }
    }, [step, selectedDoctor, selectedDate]);

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
            router.push("/login?redirect=/portal/book");
            return;
        }
        if (!selectedDoctor || !selectedDate || !selectedTime) return;

        setBookingProcessing(true);
        try {
            // Combine date and time
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: user.uid,
                patientName: `${profile.firstName} ${profile.lastName}`,
                patientEmail: profile.email,
                doctorId: selectedDoctor.id,
                date: appointmentDate,
                time: selectedTime,
            });

            toast.success("¡Turno confirmado con éxito!");
            router.push("/portal"); // Redirect to dashboard
        } catch (error) {
            console.error(error);
            toast.error("Error al confirmar el turno. Intente nuevamente.");
        } finally {
            setBookingProcessing(false);
        }
    };

    const resetWizard = () => {
        setStep(1);
        setSelectedDoctor(null);
        setSelectedDate(undefined);
        setSelectedTime(null);
    };

    // --- Render Steps ---

    const renderStep1_Doctors = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">1. Seleccione un Profesional</h2>
            {loadingDoctors ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map(doc => (
                        <Card
                            key={doc.id}
                            className="cursor-pointer hover:border-primary transition-colors flex flex-row items-center p-4 space-x-4"
                            onClick={() => handleDoctorSelect(doc)}
                        >
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{doc.lastName}, {doc.firstName}</h3>
                                <p className="text-sm text-slate-500">{doc.specialty}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStep2_Date = () => (
        <div className="space-y-4 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">2. Seleccione una Fecha</h2>
            <p className="text-muted-foreground mb-4">
                Doctor: <span className="font-medium text-foreground">{selectedDoctor?.lastName}</span>
            </p>
            <div className="border rounded-md p-4 bg-white">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                        // Disable past days
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today; // || (date.getDay() === 0 || date.getDay() === 6) if weekends off
                    }}
                    initialFocus
                    locale={es}
                />
            </div>
            <Button variant="ghost" onClick={() => setStep(1)}>Volver</Button>
        </div>
    );

    const renderStep3_Time = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">3. Seleccione un Horario</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </div>

            {loadingSlots ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : availableSlots.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No hay turnos disponibles para esta fecha.</p>
                    <Button variant="link" onClick={() => setStep(2)}>Elegir otra fecha</Button>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map(time => (
                        <Button
                            key={time}
                            variant="outline"
                            className="hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleTimeSelect(time)}
                        >
                            {time}
                        </Button>
                    ))}
                </div>
            )}
            <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>Volver</Button>
        </div>
    );

    const renderStep4_Confirm = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Confirmar Turno</h2>
                <p className="text-muted-foreground">Verifique los datos antes de confirmar.</p>
            </div>

            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Doctor:</span>
                        <span className="font-medium">{selectedDoctor?.lastName}, {selectedDoctor?.firstName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Especialidad:</span>
                        <span className="font-medium">{selectedDoctor?.specialty}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium capitalize">{selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Horario:</span>
                        <span className="font-medium">{selectedTime} hs</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Paciente:</span>
                        <span className="font-medium">{profile?.firstName} {profile?.lastName}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full" size="lg" onClick={handleConfirmBooking} disabled={bookingProcessing}>
                        {bookingProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Reserva
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep(3)} disabled={bookingProcessing}>
                        Volver
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {step === 1 && renderStep1_Doctors()}
            {step === 2 && renderStep2_Date()}
            {step === 3 && renderStep3_Time()}
            {step === 4 && renderStep4_Confirm()}
        </div>
    );
}
