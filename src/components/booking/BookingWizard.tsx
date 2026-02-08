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
import { Loader2, Calendar as CalendarIcon, Clock, User as UserIcon, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { INSURANCE_PROVIDERS } from "@/constants";

const DOCTOR_PHOTOS: Record<string, string> = {
    'capparelli': '/assets/doctors/Ger_perfil.jpeg',
    'secondi': '/assets/doctors/Vero_perfil.jpeg',
};

export function BookingWizard() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const rescheduleId = searchParams.get('reschedule');
    const preselectedDoctorId = searchParams.get('doctorId');

    // Step 1: Select Doctor
    // Step 2: Intake Questions (Primera vez? + Consultation type for Secondi)
    // Step 3: Select Date & Time (Side by Side)
    // Step 4: Confirm
    // Step 5: Success
    const [step, setStep] = useState(1);

    // Data
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    // Selections
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Step 2: Intake Questions
    const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
    const [consultationType, setConsultationType] = useState<string | null>(null);

    // Slots
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [doctorExceptions, setDoctorExceptions] = useState<{ date: string }[]>([]);

    // Processing
    const [bookingProcessing, setBookingProcessing] = useState(false);

    // Appointment limit check - now per-doctor (handled on doctor selection)
    const [doctorLimitReached, setDoctorLimitReached] = useState<string | null>(null); // Stores doctor name if limit reached

    // Track which doctors patient already has active appointments with
    const [existingAppointmentDoctors, setExistingAppointmentDoctors] = useState<{ id: string, name: string }[]>([]);

    // Auth Guard
    useEffect(() => {
        if (!loading && !user) {
            const currentParams = searchParams.toString();
            const redirectUrl = currentParams ? `${pathname}?${currentParams}` : pathname;
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }
    }, [user, loading, router, pathname, searchParams]);

    // Load initial data and handle params
    useEffect(() => {
        if (!user) return; // Prevent fetching if not authenticated

        const fetchDoctors = async () => {

            try {
                const data = await doctorService.getAllDoctors();
                setDoctors(data);

                // Fetch which doctors patient already has active appointments with
                const existingDoctors: { id: string, name: string }[] = [];
                for (const doc of data) {
                    const activeCount = await appointmentService.countActiveAppointments(user.uid, doc.id);
                    if (activeCount > 0) {
                        existingDoctors.push({ id: doc.id, name: `${doc.lastName}, ${doc.firstName}` });
                    }
                }
                setExistingAppointmentDoctors(existingDoctors);

                // Handle preselection logic
                if (preselectedDoctorId) {
                    const doc = data.find(d => d.id === preselectedDoctorId);
                    if (doc) {
                        // Check if already has appointment with this doctor
                        const hasExisting = existingDoctors.some(ed => ed.id === preselectedDoctorId);
                        if (hasExisting) {
                            setDoctorLimitReached(`${doc.lastName}, ${doc.firstName}`);
                        } else {
                            setSelectedDoctor(doc);
                            setStep(2); // Skip directly to Date/Time selection
                        }
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
    }, [preselectedDoctorId, user]);

    // Fetch exceptions when doctor changes
    useEffect(() => {
        if (selectedDoctor) {
            const fetchExceptions = async () => {
                const { exceptionService } = await import('@/services/exceptionService');
                const exceptions = await exceptionService.getDoctorExceptions(selectedDoctor.id);
                setDoctorExceptions(exceptions);
            };
            fetchExceptions();
        }
    }, [selectedDoctor]);

    // Fetch availability when Date changes (within Step 3)
    useEffect(() => {
        if (step === 3 && selectedDoctor && selectedDate) {
            const fetchAvailability = async () => {
                setLoadingSlots(true);
                setAvailableSlots([]);
                setSelectedTime(null); // Reset time when date changes
                try {
                    const busyAppointments = await appointmentService.getDoctorAppointmentsOnDate(selectedDoctor.id, selectedDate);
                    const slots = await availabilityService.getAvailableSlots(selectedDoctor, selectedDate, busyAppointments);
                    setAvailableSlots(slots);
                } catch (error) {
                    toast.error("Error recuperando disponibilidad.");
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchAvailability();
        }
    }, [selectedDoctor, selectedDate, step]);

    const handleDoctorSelect = async (doc: Doctor) => {
        // Check if patient already has an active appointment with this doctor
        if (user) {
            const activeWithDoctor = await appointmentService.countActiveAppointments(user.uid, doc.id);
            if (activeWithDoctor >= 1) {
                setDoctorLimitReached(`${doc.lastName}, ${doc.firstName}`);
                return;
            }
        }
        setSelectedDoctor(doc);
        setStep(2);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        // Time is reset by useEffect
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
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
                setSelectedTime(null);
                // Stay on step 3
                return;
            }

            // 2. Create the appointment
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: user.uid,
                patientName: (profile.firstName && profile.lastName)
                    ? `${profile.firstName} ${profile.lastName}`
                    : (user.displayName || "Paciente"),
                patientEmail: profile.email || user.email || "",
                doctorId: selectedDoctor.id,
                doctorName: `${selectedDoctor.lastName}, ${selectedDoctor.firstName}`,
                date: appointmentDate,
                time: selectedTime,
                type: consultationType
                    ? SECONDI_CONSULTATION_TYPES.find(t => t.id === consultationType)?.label || 'Consulta'
                    : 'Consulta',
                isFirstVisit: isFirstVisit ?? false,
                consultationType: consultationType || null,
            });

            // 3. If rescheduling, cancel the old one
            if (rescheduleId) {
                await appointmentService.cancelAppointment(rescheduleId);
                toast.success("Turno reprogramado con éxito.");
            } else {
                toast.success("¡Turno confirmado con éxito!");
            }

            // 4. Show success screen
            setStep(5);

        } catch (error: any) {
            console.error(error);
            if (error?.message?.includes('LIMIT_EXCEEDED')) {
                toast.error("Ya tienes un turno activo con este profesional.");
                setDoctorLimitReached(selectedDoctor ? `${selectedDoctor.lastName}, ${selectedDoctor.firstName}` : 'este profesional');
            } else {
                toast.error("Error al confirmar el turno. Intente nuevamente.");
            }
        } finally {
            setBookingProcessing(false);
        }
    };

    // Group slots
    const morningSlots = availableSlots.filter(t => parseInt(t.split(':')[0]) < 13);
    const afternoonSlots = availableSlots.filter(t => parseInt(t.split(':')[0]) >= 13);

    if (loading) {
        return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
    }

    if (!user) {
        return null; // Prevents flashing content before redirect
    }

    // Show limit reached blocker for specific doctor
    if (doctorLimitReached) {
        return (
            <div className="flex justify-center items-center min-h-[400px] p-4">
                <Card className="max-w-md w-full text-center border-orange-300 bg-orange-50">
                    <CardHeader>
                        <div className="mx-auto bg-orange-100 rounded-full p-4 w-fit mb-4">
                            <AlertCircle className="h-12 w-12 text-orange-600" />
                        </div>
                        <CardTitle className="text-orange-700">Ya tienes turno con este profesional</CardTitle>
                        <CardDescription>
                            Ya tienes un turno activo con <strong>{doctorLimitReached}</strong>. Puedes elegir otro profesional o esperar a que finalice tu turno actual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button onClick={() => setDoctorLimitReached(null)} variant="outline" className="w-full">
                            Elegir otro profesional
                        </Button>
                        <Button onClick={() => router.push('/portal')} className="w-full">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Ver Mis Turnos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Steps Render ---

    const renderStep1_Doctors = () => {
        // Filter doctors based on user profile insurance
        const filteredDoctors = doctors.filter(doc => {
            if (!profile?.insurance) return true; // Fallback
            const docInsurances = doc.acceptedInsurances || [];

            // Special cases
            if (profile.insurance === 'PARTICULAR') {
                return docInsurances.includes('PARTICULAR') || docInsurances.length === 0;
            }
            return docInsurances.includes(profile.insurance);
        });

        const hasDoctors = filteredDoctors.length > 0;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-4 text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">1. Seleccione un Profesional</h1>
                    <p className="text-slate-500 mt-2">Elija el médico con el que desea atenderse.</p>
                </header>

                {/* Banner showing existing appointments */}
                {existingAppointmentDoctors.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-800">
                                {existingAppointmentDoctors.length === 1
                                    ? "Ya tienes un turno activo"
                                    : "Ya tienes turnos activos"}
                            </h3>
                            <p className="text-blue-700 text-sm mt-1">
                                No puedes sacar más turnos con{" "}
                                <span className="font-bold">
                                    {existingAppointmentDoctors.map(d => d.name).join(" y ")}
                                </span>.
                                {existingAppointmentDoctors.length < 2 && (
                                    <span className="block mt-1">Puedes elegir otro profesional para tu próximo turno.</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {!hasDoctors && profile?.insurance && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-800">No encontramos profesionales para {profile.insurance}</h3>
                            <p className="text-yellow-700 text-sm mt-1">
                                Actualmente no hay doctores disponibles para tu cobertura.
                                Puedes intentar reservar como <span className="font-bold">PARTICULAR</span> si lo deseas.
                            </p>
                        </div>
                    </div>
                )}

                {loadingDoctors ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDoctors.map(doc => (
                            <Card
                                key={doc.id}
                                className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all flex flex-row items-center p-5 space-x-4 bg-white border-slate-200 group"
                                onClick={() => handleDoctorSelect(doc)}
                            >
                                <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors overflow-hidden">
                                    {(doc.id === 'capparelli' || doc.lastName.toLowerCase().includes('capparelli')) ? (
                                        <img src="/assets/doctors/Ger_perfil.jpeg" alt="Dr. Capparelli" className="h-full w-full object-cover" />
                                    ) : (doc.id === 'secondi' || doc.lastName.toLowerCase().includes('secondi')) ? (
                                        <img src="/assets/doctors/Vero_perfil.jpeg" alt="Dra. Secondi" className="h-full w-full object-cover" />
                                    ) : doc.photoURL ? (
                                        <img
                                            src={doc.photoURL}
                                            alt={`${doc.firstName} ${doc.lastName}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-lg">
                                            {doc.firstName.charAt(0)}{doc.lastName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                                        {(doc.id === 'secondi' || doc.lastName.toLowerCase().includes('secondi')) ? 'Dra. María Verónica Secondi' :
                                            (doc.id === 'capparelli' || doc.lastName.toLowerCase().includes('capparelli')) ? 'Dr. Germán Capparelli' :
                                                `${(doc.gender === 'female' || doc.specialty?.toLowerCase().includes('ginecología')) ? 'Dra.' : 'Dr.'} ${doc.lastName}, ${doc.firstName}`}
                                    </h3>
                                    <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{doc.specialty}</Badge>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {doc.acceptedInsurances?.slice(0, 3).map(ins => (
                                            <span key={ins} className="text-[10px] uppercase tracking-wider font-medium bg-slate-50 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                                {ins}
                                            </span>
                                        ))}
                                        {(doc.acceptedInsurances?.length || 0) > 3 && (
                                            <span className="text-[10px] px-1.5 py-0.5 text-slate-400">+{doc.acceptedInsurances!.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Consultation types for Dra. Secondi
    const SECONDI_CONSULTATION_TYPES = [
        { id: 'consulta-ginecologica', label: 'Consulta Ginecológica' },
        { id: 'pap-colpo', label: 'Consulta Pap y Colpo' },
        { id: 'prueba-hpv', label: 'Prueba de HPV' },
    ];

    const isSecondi = selectedDoctor?.id === 'secondi' || selectedDoctor?.lastName?.toLowerCase().includes('secondi');

    // Validation for Step 2
    const canProceedFromStep2 = isFirstVisit !== null && (!isSecondi || consultationType !== null);

    const renderStep2_Intake = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">2. Información de la Consulta</h1>
                <p className="text-lg text-slate-500">
                    Turno con <span className="font-semibold text-slate-800">
                        {selectedDoctor?.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                            selectedDoctor?.id === 'capparelli' ? 'Dr. Germán Capparelli' :
                                `${selectedDoctor?.gender === 'female' ? 'Dra.' : 'Dr.'} ${selectedDoctor?.lastName}, ${selectedDoctor?.firstName}`}
                    </span>
                </p>
            </header>

            <div className="space-y-8">
                {/* Primera Vez? Question */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-slate-900">¿Es tu primera vez con este profesional?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsFirstVisit(true)}
                                className={cn(
                                    "p-6 rounded-xl border-2 text-center transition-all duration-200 font-semibold text-lg",
                                    isFirstVisit === true
                                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                        : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                                )}
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => setIsFirstVisit(false)}
                                className={cn(
                                    "p-6 rounded-xl border-2 text-center transition-all duration-200 font-semibold text-lg",
                                    isFirstVisit === false
                                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                        : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                                )}
                            >
                                No
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Consultation Type - Only for Dra. Secondi */}
                {isSecondi && (
                    <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-slate-900">Tipo de Consulta</CardTitle>
                            <CardDescription>Seleccione el motivo de su visita</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {SECONDI_CONSULTATION_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setConsultationType(type.id)}
                                        className={cn(
                                            "p-4 rounded-lg border-2 text-left transition-all duration-200 font-medium",
                                            consultationType === type.id
                                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                                : "border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
                    <Button variant="ghost" onClick={() => { setStep(1); setIsFirstVisit(null); setConsultationType(null); }} className="text-slate-500 hover:text-slate-900">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Cambiar Profesional
                    </Button>
                    <Button
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={!canProceedFromStep2}
                        onClick={() => setStep(3)}
                    >
                        OK <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderStep3_Selection = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">3. Seleccione Fecha y Hora</h1>
                <p className="text-lg text-slate-500">
                    Turnos disponibles para <span className="font-semibold text-slate-800">
                        {selectedDoctor?.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                            selectedDoctor?.id === 'capparelli' ? 'Dr. Germán Capparelli' :
                                `${selectedDoctor?.gender === 'female' ? 'Dra.' : 'Dr.'} ${selectedDoctor?.lastName}, ${selectedDoctor?.firstName}`}
                    </span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Calendar */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 w-full max-w-sm mx-auto">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                // 1. Past dates
                                if (date < today) return true;

                                // 2. Non-working days (based on doctor schedule)
                                if (selectedDoctor && selectedDoctor.schedule.workDays) {
                                    const day = date.getDay(); // 0-6
                                    if (!selectedDoctor.schedule.workDays.includes(day)) return true;
                                }

                                // 3. Exceptions/Holidays
                                const dateString = format(date, 'yyyy-MM-dd');
                                if (doctorExceptions.some(e => e.date === dateString)) return true;

                                // 4. Max days ahead (Appointment Limits)
                                const maxDays = selectedDoctor?.maxDaysAhead || 30;
                                const maxDate = new Date();
                                maxDate.setDate(today.getDate() + maxDays);
                                maxDate.setHours(23, 59, 59, 999);
                                if (date > maxDate) return true;

                                return false;
                            }}
                            initialFocus
                            locale={es}
                            className="p-0 w-full"
                            classNames={{
                                months: "w-full flex flex-col",
                                month: "space-y-4 w-full",
                                caption: "flex justify-center pt-1 relative items-center mb-4 capitalize font-bold text-lg text-slate-800",
                                caption_label: "text-sm font-medium",
                                nav: "space-x-1 flex items-center absolute right-1 top-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex w-full justify-between mb-2",
                                head_cell: "text-slate-400 font-medium text-[0.8rem] capitalize w-10 text-center",
                                row: "flex w-full mt-2 justify-between",
                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                    "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                                ),
                                day_selected: "bg-slate-900 text-white hover:bg-slate-800 hover:text-white focus:bg-slate-900 focus:text-white shadow-lg scale-105 font-medium",
                                day_today: "bg-blue-50 text-blue-700 font-semibold border border-blue-100",
                                day_outside: "text-slate-300 opacity-30",
                                day_disabled: "text-slate-200 opacity-40 cursor-not-allowed",
                                day_hidden: "invisible",
                            }}
                        />
                    </div>
                    <Button variant="ghost" onClick={() => setStep(2)} className="mt-6 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>

                {/* Right Column: Time Slots */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col min-h-[500px]">
                    <div className="mb-6 flex items-baseline justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-semibold text-slate-800">Horarios Disponibles</h3>
                        <span className="text-slate-500 font-medium capitalize">
                            {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "Seleccione un día"}
                        </span>
                    </div>

                    <div className="flex-grow">
                        {!selectedDate ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <CalendarIcon className="h-12 w-12 mb-3 opacity-20" />
                                <p>Seleccione una fecha en el calendario</p>
                            </div>
                        ) : loadingSlots ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader2 className="animate-spin text-primary h-8 w-8 mb-2" />
                                <p className="text-slate-400">Buscando horarios...</p>
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                                <p>No hay turnos disponibles para esta fecha.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {morningSlots.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Mañana</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {morningSlots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={cn(
                                                        "py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-200",
                                                        selectedTime === time
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                                                            : "border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 bg-transparent"
                                                    )}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {afternoonSlots.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Tarde</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {afternoonSlots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={cn(
                                                        "py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-200",
                                                        selectedTime === time
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                                                            : "border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 bg-transparent"
                                                    )}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-500">
                            {selectedDate && selectedTime ? (
                                <span>
                                    Seleccionado: <span className="font-semibold text-slate-900 capitalize">{format(selectedDate, "EEEE d", { locale: es })} - {selectedTime} hs</span>
                                </span>
                            ) : (
                                <span>Selecciona fecha y hora para continuar</span>
                            )}
                        </div>
                        <Button
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                            disabled={!selectedDate || !selectedTime}
                            onClick={() => setStep(4)} // Go to Confirm
                        >
                            Confirmar Turno <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4_Confirm = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-50 p-4 rounded-full">
                        <CheckCircle className="h-10 w-10 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Confirmar Reserva</h2>
                <p className="text-slate-500 text-lg">Verifique los datos antes de finalizar.</p>
            </div>

            <Card className="shadow-lg border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-slate-500" />
                        Detalles del Turno
                    </h3>
                </div>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Profesional</p>
                            <p className="font-semibold text-lg text-slate-900">
                                {selectedDoctor?.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                                    selectedDoctor?.id === 'capparelli' ? 'Dr. Germán Capparelli' :
                                        `${selectedDoctor?.lastName}, ${selectedDoctor?.firstName}`}
                            </p>
                            <Badge variant="outline" className="mt-1">{selectedDoctor?.specialty}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Fecha y Hora</p>
                            <p className="font-semibold text-lg text-slate-900 capitalize">{selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                            <p className="text-blue-600 font-bold text-xl">{selectedTime} hs</p>
                        </div>
                        <div className="md:col-span-2 pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Paciente</p>
                            <p className="font-medium text-slate-900">{profile?.firstName} {profile?.lastName}</p>
                            <p className="text-sm text-slate-400">{profile?.email}</p>
                            {profile?.insurance && (
                                <Badge className="mt-2 bg-slate-100 text-slate-700 hover:bg-slate-200 pointer-events-none">
                                    {profile.insurance}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-4 justify-end">
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setStep(3)}>
                        Volver atrás
                    </Button>
                    <Button
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                        onClick={handleConfirmBooking}
                        disabled={bookingProcessing}
                    >
                        {bookingProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {rescheduleId ? "Confirmar Cambio" : "Finalizar Reserva"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );

    const renderStep5_Success = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-slate-900">¡Todo listo!</h2>
            <p className="text-slate-500 text-xl mb-10 max-w-md">
                Su turno ha sido {rescheduleId ? 'reprogramado' : 'reservado'} existosamente. Se ha enviado un correo con los detalles.
            </p>

            <Card className="w-full max-w-sm mb-8 border-green-200 bg-green-50/50 shadow-sm">
                <CardContent className="pt-8 pb-8 space-y-2">
                    <p className="font-bold text-2xl text-green-900">{selectedTime} hs</p>
                    <p className="font-medium text-lg text-green-800 capitalize">{format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })}</p>
                    <div className="w-16 h-1 bg-green-200 mx-auto my-3 rounded-full"></div>
                    <p className="text-green-700">
                        {selectedDoctor?.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                            selectedDoctor?.id === 'capparelli' ? 'Dr. Germán Capparelli' :
                                `${selectedDoctor?.gender === 'female' ? 'Dra.' : 'Dr.'} ${selectedDoctor?.lastName}`}
                    </p>
                </CardContent>
            </Card>

            <Link href="/portal">
                <Button size="lg" className="px-10 py-6 text-lg bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all">
                    Ir a Mis Turnos
                </Button>
            </Link>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {step === 1 && renderStep1_Doctors()}
            {step === 2 && renderStep2_Intake()}
            {step === 3 && renderStep3_Selection()}
            {step === 4 && renderStep4_Confirm()}
            {step === 5 && renderStep5_Success()}
        </div>
    );
}
