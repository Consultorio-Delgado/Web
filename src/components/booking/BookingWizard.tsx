"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Doctor } from "@/types";
import { doctorService } from "@/services/doctors";
import { appointmentService } from "@/services/appointments";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { es } from "date-fns/locale";
import { format } from "date-fns";

// Pasos del Wizard
type Step = 1 | 2 | 3 | 4;

export function BookingWizard() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Data State
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Fetch doctors on mount
    useEffect(() => {
        const fetchDoctors = async () => {
            const data = await doctorService.getAll();
            setDoctors(data);
        };
        fetchDoctors();
    }, []);

    // Reset subsequent states when changing previous ones
    useEffect(() => {
        setSelectedDate(undefined);
        setSelectedTime(null);
    }, [selectedDoctor]);

    useEffect(() => {
        setSelectedTime(null);
        if (selectedDate && selectedDoctor) {
            generateSlots(selectedDate, selectedDoctor);
        }
    }, [selectedDate, selectedDoctor]);

    const generateSlots = (date: Date, doctor: Doctor) => {
        // 1. Get day name in English for the schedule map check (Monday, Tuesday...)
        // Better to use getDay() -> 0=Sunday, 1=Monday...
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayString = daysMap[date.getDay()];

        const hours = doctor.schedule[dayString]; // e.g., ["16:00", "20:00"]

        if (!hours || hours.length < 2) {
            setAvailableSlots([]);
            return;
        }

        // Generate slots based on doctor.slotDuration (default 30 min)
        const duration = doctor.slotDuration || 30;
        const [startStr, endStr] = hours;
        const slots: string[] = [];

        let currentHour = parseInt(startStr.split(':')[0]);
        let currentMin = parseInt(startStr.split(':')[1]);

        const endHour = parseInt(endStr.split(':')[0]);
        const endMin = parseInt(endStr.split(':')[1]);

        const endTimeInMinutes = endHour * 60 + endMin;

        while (true) {
            const currentTimeInMinutes = currentHour * 60 + currentMin;
            // Stop if the current slot start + duration exceeds the end time
            if (currentTimeInMinutes + duration > endTimeInMinutes) break;

            const timeLabel = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            slots.push(timeLabel);

            // Add duration
            currentMin += duration;
            while (currentMin >= 60) {
                currentHour += 1;
                currentMin -= 60;
            }
        }
        setAvailableSlots(slots);
    };

    const isDayDisabled = (date: Date) => {
        // Disable past dates
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

        // Disable if doctor doesn't work that day
        if (selectedDoctor) {
            const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayString = daysMap[date.getDay()];
            return !selectedDoctor.schedule[dayString];
        }
        return false;
    };

    const handleNext = () => {
        setStep((prev) => Math.min(prev + 1, 4) as Step);
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 1) as Step);
    };

    const handleConfirm = async () => {
        if (!selectedDoctor || !selectedDate || !selectedTime || !user) return;

        setLoading(true);
        try {
            const appointmentId = await appointmentService.create({
                patientId: user.uid,
                patientName: profile?.firstName + ' ' + profile?.lastName,
                patientEmail: user.email || '',
                doctorId: selectedDoctor.id,
                date: selectedDate,
                time: selectedTime,
            });

            setSuccess(true);
            // Optional: Wait 2 secs then redirect
            setTimeout(() => {
                router.push('/portal?success=true');
            }, 2000);

        } catch (error) {
            console.error("Error confirming appointment:", error);
            alert("Hubo un error al reservar el turno. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <CheckCircle className="h-24 w-24 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">¡Turno Confirmado!</h2>
                <p className="text-slate-600">
                    Tu cita con {selectedDoctor?.firstName} {selectedDoctor?.lastName} ha sido reservada con éxito.
                </p>
                <p className="text-sm text-muted-foreground">Te estamos redirigiendo a tu panel...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                    <span className={step >= 1 ? "text-primary font-bold" : ""}>1. Especialista</span>
                    <span className={step >= 2 ? "text-primary font-bold" : ""}>2. Fecha</span>
                    <span className={step >= 3 ? "text-primary font-bold" : ""}>3. Hora</span>
                    <span className={step >= 4 ? "text-primary font-bold" : ""}>4. Confirmar</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            <Card className="min-h-[400px] flex flex-col justify-between shadow-lg">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Selecciona un Profesional"}
                        {step === 2 && "Elige una Fecha"}
                        {step === 3 && "Selecciona un Horario"}
                        {step === 4 && "Confirma tu Turno"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Nuestros especialistas están listos para atenderte."}
                        {step === 2 && selectedDoctor && `Viendo agenda de ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                        {step === 4 && "Revisa los datos antes de confirmar."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Step 1: Doctor Selection */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {doctors.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-50 flex items-center gap-4 ${selectedDoctor?.id === doc.id ? 'border-primary bg-blue-50' : 'border-slate-100'}`}
                                >
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${doc.color === 'emerald' ? 'bg-emerald-500' : doc.color === 'pink' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                                        {doc.firstName[0]}{doc.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{doc.firstName} {doc.lastName}</h3>
                                        <p className="text-sm text-muted-foreground">{doc.specialty}</p>
                                    </div>
                                </div>
                            ))}
                            {doctors.length === 0 && <div className="text-center col-span-2 text-muted-foreground">Cargando profesionales...</div>}
                        </div>
                    )}

                    {/* Step 2: Date Selection */}
                    {step === 2 && (
                        <div className="flex flex-col items-center">
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={es}
                                    disabled={isDayDisabled}
                                    initialFocus
                                    className="rounded-md border"
                                />
                            </div>
                            {selectedDate && <p className="mt-4 text-primary font-medium flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> {format(selectedDate, "PPP", { locale: es })}</p>}
                        </div>
                    )}

                    {/* Step 3: Time Selection */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-sm text-center text-muted-foreground mb-4">
                                Horarios disponibles para el {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : ''}
                            </p>
                            {availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {availableSlots.map(time => (
                                        <Button
                                            key={time}
                                            variant={selectedTime === time ? "default" : "outline"}
                                            onClick={() => setSelectedTime(time)}
                                            className={selectedTime === time ? "bg-primary text-white" : ""}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                                    No hay horarios disponibles para este día.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-6 rounded-lg space-y-4 border border-slate-100">
                                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${selectedDoctor?.color === 'emerald' ? 'bg-emerald-500' : selectedDoctor?.color === 'pink' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                                        {selectedDoctor?.firstName[0]}{selectedDoctor?.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedDoctor?.firstName} {selectedDoctor?.lastName}</h3>
                                        <p className="text-slate-500">{selectedDoctor?.specialty}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Fecha</span>
                                        <span className="font-medium flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            {selectedDate ? format(selectedDate, "PPP", { locale: es as any }) : '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Hora</span>
                                        <span className="font-medium flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {selectedTime} hs
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                                Al confirmar, recibirás un correo electrónico con los detalles de tu turno.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
                        Atrás
                    </Button>

                    {step < 4 ? (
                        <Button onClick={handleNext} disabled={
                            (step === 1 && !selectedDoctor) ||
                            (step === 2 && !selectedDate) ||
                            (step === 3 && !selectedTime)
                        }>
                            Siguiente
                        </Button>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={handleConfirm} disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</> : "Confirmar Reserva"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
