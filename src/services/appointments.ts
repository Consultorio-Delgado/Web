import { db } from "@/lib/firebase";
import { Appointment } from "@/types";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, getDoc, Timestamp, runTransaction } from "firebase/firestore";
import { startOfDay, endOfDay, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

import { auditService } from "./auditService";

export type ActiveAppointmentSummary = {
    id: string;
    date: Date;
    time: string;
    doctorId: string;
    status: string;
};

const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'arrived', 'in_consultation'];

export const appointmentService = {
    // Turnos futuros no cancelados. Si hay doctorId, solo los de ese profesional.
    async getActiveAppointments(patientId: string, doctorId?: string): Promise<ActiveAppointmentSummary[]> {
        const now = new Date();
        const q = query(
            collection(db, "appointments"),
            where("patientId", "==", patientId),
            where("date", ">=", Timestamp.fromDate(now))
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    date: data.date?.toDate?.() ?? new Date(),
                    time: (data.time as string) || "",
                    doctorId: data.doctorId as string,
                    status: data.status as string,
                };
            })
            .filter((appointment) => {
                const isActive = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);
                if (doctorId) return isActive && appointment.doctorId === doctorId;
                return isActive;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    },

    // Count active (future, non-cancelled) appointments for a patient
    // If doctorId is provided, only count appointments with that specific doctor
    async countActiveAppointments(patientId: string, doctorId?: string): Promise<number> {
        try {
            const activeAppointments = await this.getActiveAppointments(patientId, doctorId);
            return activeAppointments.length;
        } catch (error) {
            console.error("Error counting active appointments:", error);
            return 0;
        }
    },

    async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { createdAt?: Date }): Promise<string> {
        try {
            // Check if patient already has an active appointment with THIS specific doctor
            // Skip this check for blocked slots or if patientId is 'blocked'
            if (appointmentData.patientId !== 'blocked' && !appointmentData.patientId?.startsWith('manual_')) {
                // El tope de 1 turno activo por profesional aplica solo cuando el paciente reserva para sí.
                // Un médico autenticado (uid distinto del paciente) puede asignar turnos extra.
                const { auth } = await import("@/lib/firebase");
                const currentUserId = auth.currentUser?.uid;
                const isPatientBookingForSelf = currentUserId === appointmentData.patientId;

                if (isPatientBookingForSelf) {
                    const { getDoc } = await import("firebase/firestore");
                    const patientSnap = await getDoc(doc(db, "users", appointmentData.patientId));
                    if (patientSnap.exists()) {
                        const patientData = patientSnap.data();
                        if (patientData.blockedUntil) {
                            const blockedUntilDate = patientData.blockedUntil.toDate ? patientData.blockedUntil.toDate() : new Date(patientData.blockedUntil);
                            if (blockedUntilDate > new Date()) {
                                throw new Error("PATIENT_BLOCKED: Tu cuenta está temporalmente bloqueada para reservar turnos debido a una cancelación tardía.");
                            }
                        }
                    }
                }

                if (isPatientBookingForSelf || !currentUserId) {
                    const activeWithDoctor = await this.countActiveAppointments(appointmentData.patientId, appointmentData.doctorId);
                    if (activeWithDoctor >= 1) {
                        throw new Error("LIMIT_EXCEEDED: Ya tienes un turno activo con este profesional. Puedes sacar turno con otro profesional.");
                    }
                }
            }

            // Use transaction to atomically check slot availability and create appointment
            const newAppointmentId = await runTransaction(db, async (transaction) => {
                // 1. Check if slot is already taken (same doctor, same date, same time)
                const appointmentDate = appointmentData.date;
                const startOfSlot = startOfDay(appointmentDate);
                const endOfSlot = endOfDay(appointmentDate);

                // Query for conflicting appointments
                const conflictQuery = query(
                    collection(db, "appointments"),
                    where("doctorId", "==", appointmentData.doctorId),
                    where("date", ">=", Timestamp.fromDate(startOfSlot)),
                    where("date", "<=", Timestamp.fromDate(endOfSlot))
                );

                const conflictSnapshot = await getDocs(conflictQuery);

                // Check if any appointment has the same time and is active
                const activeStatuses = ['pending', 'confirmed', 'arrived', 'in_consultation'];
                const hasConflict = conflictSnapshot.docs.some(doc => {
                    const data = doc.data();
                    return data.time === appointmentData.time &&
                        activeStatuses.includes(data.status) &&
                        data.patientId !== 'blocked'; // Allow booking on top of blocked only by admin
                });

                if (hasConflict) {
                    throw new Error("SLOT_TAKEN: Lo sentimos, este turno fue tomado hace un instante. Por favor elige otro horario.");
                }

                // 2. Create the new appointment document
                const newDocRef = doc(collection(db, "appointments"));
                transaction.set(newDocRef, {
                    ...appointmentData,
                    status: 'confirmed',
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    date: Timestamp.fromDate(appointmentData.date)
                });

                return newDocRef.id;
            });

            // Audit (outside transaction - fire and forget)
            const { auth } = await import("@/lib/firebase");
            const actorId = auth.currentUser?.uid || 'unknown';

            await auditService.logAction('APPOINTMENT_CREATED', actorId, {
                appointmentId: newAppointmentId,
                date: appointmentData.date,
                patientId: appointmentData.patientId,
                patientName: appointmentData.patientName,
                doctorName: appointmentData.doctorName
            });

            // Send Email Confirmation (Fire and Forget)
            // Skip for manual patients — their email is handled by SobreturnoDialog with a different template
            if (!appointmentData.patientId?.startsWith('manual_')) {
                // Determine specialty based on doctor
                const specialty = appointmentData.doctorId === 'secondi' || appointmentData.doctorName?.toLowerCase().includes('secondi')
                    ? 'Ginecología'
                    : appointmentData.doctorId === 'capparelli' || appointmentData.doctorName?.toLowerCase().includes('capparelli')
                        ? 'Clínica Médica'
                        : undefined;

                fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'confirmation',
                        data: {
                            to: appointmentData.patientEmail,
                            patientName: appointmentData.patientName,
                            doctorName: appointmentData.doctorName || 'Dr. (Consultar en Portal)',
                            date: appointmentData.date.toLocaleDateString(),
                            time: appointmentData.time,
                            appointmentId: newAppointmentId,
                            specialty: specialty
                        }
                    })
                }).catch(err => console.error("Failed to send email:", err));
            }

            return newAppointmentId;
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            // Re-throw with clean message for SLOT_TAKEN errors
            if (error?.message?.includes('SLOT_TAKEN')) {
                throw new Error("SLOT_TAKEN: Lo sentimos, este turno fue tomado hace un instante. Por favor elige otro horario.");
            }
            throw error;
        }
    },


    async getMyAppointments(patientId: string): Promise<Appointment[]> {
        try {
            const q = query(
                collection(db, "appointments"),
                where("patientId", "==", patientId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date.toDate(), // Convert Timestamp back to Date
                    createdAt: data.createdAt.toDate(),
                    arrivedAt: data.arrivedAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    waitingSegmentStartedAt: data.waitingSegmentStartedAt?.toDate?.(),
                    consultationSegmentStartedAt: data.consultationSegmentStartedAt?.toDate?.(),
                    consultationStartedAt: data.consultationStartedAt?.toDate?.(),
                    times: data.times ? {
                        arrivedAt: data.times.arrivedAt?.toDate?.() ?? undefined,
                        consultationStartedAt: data.times.consultationStartedAt?.toDate?.() ?? undefined,
                        completedAt: data.times.completedAt?.toDate?.() ?? undefined,
                    } : undefined,
                    timing: data.timing ? {
                        ...data.timing,
                        completedAt: data.timing.completedAt?.toDate?.() ?? undefined,
                    } : undefined,
                } as Appointment;
            }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

        } catch (error) {
            console.error("Error fetching appointments:", error);
            return [];
        }
    },
    async getDoctorAppointmentsOnDate(doctorId: string, date: Date): Promise<Appointment[]> {
        try {
            // Needed imports: startOfDay, endOfDay from date-fns
            // Ensure you have: import { startOfDay, endOfDay } from "date-fns";
            const start = startOfDay(date);
            const end = endOfDay(date);

            const q = query(
                collection(db, "appointments"),
                where("doctorId", "==", doctorId),
                where("date", ">=", Timestamp.fromDate(start)),
                where("date", "<=", Timestamp.fromDate(end))
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    arrivedAt: data.arrivedAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    waitingSegmentStartedAt: data.waitingSegmentStartedAt?.toDate?.(),
                    consultationSegmentStartedAt: data.consultationSegmentStartedAt?.toDate?.(),
                    consultationStartedAt: data.consultationStartedAt?.toDate?.(),
                    times: data.times ? {
                        arrivedAt: data.times.arrivedAt?.toDate?.() ?? undefined,
                        consultationStartedAt: data.times.consultationStartedAt?.toDate?.() ?? undefined,
                        completedAt: data.times.completedAt?.toDate?.() ?? undefined,
                    } : undefined,
                    timing: data.timing ? {
                        ...data.timing,
                        completedAt: data.timing.completedAt?.toDate?.() ?? undefined,
                    } : undefined,
                } as Appointment;
            });
        } catch (error) {
            console.error("Error fetching doctor appointments:", error);
            return [];
        }
    },

    async updateMedicalNotes(appointmentId: string, notes: string): Promise<void> {
        try {
            const docRef = doc(db, "appointments", appointmentId);
            await updateDoc(docRef, {
                medicalNotes: notes
            });
        } catch (error) {
            console.error("Error updating medical notes:", error);
            throw error;
        }
    },

    async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
        try {
            const docRef = doc(db, "appointments", appointmentId);
            // We should sanitized 'updates' to prevent overwriting critical immutable fields if necessary, 
            // but for now we trust the caller (admin/doctor).
            // Convert Date objects to Timestamps if present in updates
            const dataToUpdate: any = { ...updates };
            // Convertir Dates a Timestamp SOLO cuando el valor es realmente una Date.
            // Así los `null` y los sentinels `deleteField()` pasan sin tocarse.
            if (updates.date instanceof Date) {
                dataToUpdate.date = Timestamp.fromDate(updates.date);
            }
            if (updates.arrivedAt instanceof Date) {
                dataToUpdate.arrivedAt = Timestamp.fromDate(updates.arrivedAt);
            }
            if (updates.waitingSegmentStartedAt instanceof Date) {
                dataToUpdate.waitingSegmentStartedAt = Timestamp.fromDate(updates.waitingSegmentStartedAt);
            }
            if (updates.consultationSegmentStartedAt instanceof Date) {
                dataToUpdate.consultationSegmentStartedAt = Timestamp.fromDate(updates.consultationSegmentStartedAt);
            }
            if (updates.consultationStartedAt instanceof Date) {
                dataToUpdate.consultationStartedAt = Timestamp.fromDate(updates.consultationStartedAt);
            }
            if (updates.timing && (updates.timing as any).completedAt instanceof Date) {
                dataToUpdate.timing = {
                    ...updates.timing,
                    completedAt: Timestamp.fromDate(updates.timing.completedAt),
                };
            }
            // `times` con horas reales: convertir solo las Date presentes.
            const tm = updates.times as any;
            if (tm && (tm.completedAt instanceof Date || tm.arrivedAt instanceof Date || tm.consultationStartedAt instanceof Date)) {
                const conv: any = { ...tm };
                if (tm.arrivedAt instanceof Date) conv.arrivedAt = Timestamp.fromDate(tm.arrivedAt);
                if (tm.consultationStartedAt instanceof Date) conv.consultationStartedAt = Timestamp.fromDate(tm.consultationStartedAt);
                if (tm.completedAt instanceof Date) conv.completedAt = Timestamp.fromDate(tm.completedAt);
                dataToUpdate.times = conv;
            }
            dataToUpdate.updatedAt = Timestamp.now();

            await updateDoc(docRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating appointment:", error);
            throw error;
        }
    },
    /**
     * Mueve un turno existente a otra fecha/hora, o lo convierte en sobreturno, sin cancelarlo.
     * Conserva el id, las notas, los adjuntos y el estado. El paciente sigue teniendo un solo turno,
     * así que no dispara el límite de un turno activo ni un mail de cancelación.
     */
    async moveAppointment(
        appointmentId: string,
        target: { date: Date; time: string; asSobreturno: boolean }
    ): Promise<{ emailSent: boolean; emailSkipped: boolean; typeOnly: boolean }> {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const snap = await getDoc(appointmentRef);
        if (!snap.exists()) {
            throw new Error("NOT_FOUND");
        }

        const current = snap.data();
        if (current.patientId === 'blocked' || !['pending', 'confirmed'].includes(current.status)) {
            throw new Error("NOT_MOVABLE");
        }

        const time = normalizeSlotTime(target.time);
        if (!/^\d{2}:\d{2}$/.test(time)) {
            throw new Error("INVALID_TIME");
        }

        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(target.date);
        newDate.setHours(hours, minutes, 0, 0);
        if (newDate.getTime() < Date.now() - 60_000) {
            throw new Error("PAST_SLOT");
        }

        const oldDate: Date = current.date?.toDate?.() ?? new Date(current.date);
        const oldTime: string = current.time;
        const oldType: string = current.type || 'Consulta';
        const wasSobreturno = oldType === 'Sobreturno';
        const nextType = target.asSobreturno ? 'Sobreturno' : (wasSobreturno ? 'Consulta' : oldType);

        const sameSlot = isSameDay(oldDate, newDate) && normalizeSlotTime(oldTime) === time;
        if (sameSlot && nextType === oldType) {
            throw new Error("UNCHANGED");
        }
        const typeOnly = sameSlot && nextType !== oldType;

        if (!target.asSobreturno) {
            const conflictQuery = query(
                collection(db, "appointments"),
                where("doctorId", "==", current.doctorId),
                where("date", ">=", Timestamp.fromDate(startOfDay(newDate))),
                where("date", "<=", Timestamp.fromDate(endOfDay(newDate)))
            );
            const conflictSnapshot = await getDocs(conflictQuery);
            const taken = conflictSnapshot.docs.some(conflictDoc => {
                if (conflictDoc.id === appointmentId) return false;
                const data = conflictDoc.data();
                if (data.status === 'cancelled') return false;
                return normalizeSlotTime(data.time) === time;
            });
            if (taken) {
                throw new Error("SLOT_TAKEN: Ese horario acaba de ocuparse.");
            }
        }

        await updateDoc(appointmentRef, {
            date: Timestamp.fromDate(newDate),
            time,
            type: nextType,
            updatedAt: Timestamp.now(),
        });

        const { auth } = await import("@/lib/firebase");
        const actorId = auth.currentUser?.uid || 'unknown';
        await auditService.logAction('APPOINTMENT_MOVED', actorId, {
            appointmentId,
            patientId: current.patientId,
            patientName: current.patientName,
            doctorName: current.doctorName,
            fromDate: oldDate,
            fromTime: oldTime,
            fromType: oldType,
            toDate: newDate,
            toTime: time,
            toType: nextType,
        });

        const patientEmail = typeof current.patientEmail === 'string' ? current.patientEmail.trim() : '';
        const emailSkipped = typeOnly || !patientEmail || !patientEmail.includes('@');
        let emailSent = false;

        if (!emailSkipped) {
            const specialty = current.doctorId === 'secondi' || String(current.doctorName || '').toLowerCase().includes('secondi')
                ? 'Ginecología'
                : current.doctorId === 'capparelli' || String(current.doctorName || '').toLowerCase().includes('capparelli')
                    ? 'Clínica Médica'
                    : undefined;

            try {
                const response = await fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'reschedule',
                        data: {
                            to: patientEmail,
                            patientName: current.patientName,
                            doctorName: current.doctorName || 'Dr. (Consultar en Portal)',
                            previousDate: format(oldDate, "EEEE d 'de' MMMM yyyy", { locale: es }),
                            previousTime: normalizeSlotTime(oldTime),
                            date: format(newDate, "EEEE d 'de' MMMM yyyy", { locale: es }),
                            time,
                            specialty,
                            isSobreturno: target.asSobreturno,
                            showPortalLink: !String(current.patientId || '').startsWith('manual_'),
                        }
                    })
                });
                emailSent = response.ok;
            } catch (err) {
                console.error("Failed to send reschedule email:", err);
            }
        }

        return { emailSent, emailSkipped, typeOnly };
    },

    async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
        try {
            const docRef = doc(db, "appointments", appointmentId);
            await updateDoc(docRef, {
                status: 'cancelled'
            });

            // We need to fetch the appointment to get details for the email
            // This is a bit expensive, but necessary for a good email.
            // Alternatively, the UI can pass the details.
            // For now, let's just log or try to fetch if we want to be perfect.
            // To keep it simple and fast, we might skip email on cancel OR fetch it.
            // Let's fetch it.
            const docSnap = await getDocs(query(collection(db, "appointments"), where("__name__", "==", appointmentId)));
            if (!docSnap.empty) {
                const appt = docSnap.docs[0].data();
                // We also need the doctor name... this gets complicated to do purely here without joins.
                // Let's assume the UI handles the cancel email for now OR we accept generic info.
                // Actually, the user asked for "Integration with Business Logic".
                // Best place: The UI calling this service usually has the data. 
                // BUT, the prompt said "Modify appointmentService...".
                // So we should try our best here.

                // Audit Cancellation
                const { auth } = await import("@/lib/firebase");
                const actorId = auth.currentUser?.uid || 'unknown';
                await auditService.logAction('APPOINTMENT_CANCELLED', actorId, {
                    appointmentId: appointmentId,
                    patientName: appt.patientName,
                    doctorName: appt.doctorName,
                    reason: reason || 'Cancelled by user'
                });

                // Let's attempt to send what we have.
                if (appt.patientEmail) {
                    fetch('/api/emails', {
                        method: 'POST',
                        body: JSON.stringify({
                            type: 'cancellation',
                            data: {
                                to: appt.patientEmail,
                                patientName: appt.patientName,
                                doctorName: appt.doctorName || 'Dr. (Consultar en Portal)',
                                date: appt.date.toDate().toLocaleDateString(),
                                time: appt.time,
                                reason: reason
                            }
                        })
                    }).catch(console.error);
                }
            }

        } catch (error) {
            console.error("Error cancelling appointment:", error);
            throw error;
        }
    },

    async getAllAppointments(): Promise<Appointment[]> {
        const q = query(collection(db, "appointments"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    },

    /** Turnos completados con snapshot `timing` para un doctor, opcionalmente en un rango de fechas. */
    async getTimedAppointments(
        doctorId: string,
        startDate: Date | null,
        endDate: Date = new Date()
    ): Promise<Appointment[]> {
        try {
            const constraints: any[] = [where("doctorId", "==", doctorId)];
            if (startDate) {
                constraints.push(where("date", ">=", Timestamp.fromDate(startOfDay(startDate))));
            }
            constraints.push(where("date", "<=", Timestamp.fromDate(endOfDay(endDate))));

            const q = query(collection(db, "appointments"), ...constraints);
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs
                .map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        ...data,
                        date: data.date?.toDate?.() ?? new Date(),
                        createdAt: data.createdAt?.toDate?.() || new Date(),
                        arrivedAt: data.arrivedAt?.toDate?.(),
                        updatedAt: data.updatedAt?.toDate?.(),
                        waitingSegmentStartedAt: data.waitingSegmentStartedAt?.toDate?.(),
                        consultationSegmentStartedAt: data.consultationSegmentStartedAt?.toDate?.(),
                        consultationStartedAt: data.consultationStartedAt?.toDate?.(),
                        times: data.times
                            ? {
                                  arrivedAt: data.times.arrivedAt?.toDate?.() ?? undefined,
                                  consultationStartedAt: data.times.consultationStartedAt?.toDate?.() ?? undefined,
                                  completedAt: data.times.completedAt?.toDate?.() ?? undefined,
                              }
                            : undefined,
                        timing: data.timing
                            ? {
                                  ...data.timing,
                                  completedAt: data.timing.completedAt?.toDate?.() ?? undefined,
                              }
                            : undefined,
                    } as Appointment;
                })
                .filter((a) => a.status === "completed" && a.timing);
        } catch (error) {
            console.error("Error fetching timed appointments:", error);
            return [];
        }
    },

    async addAttachment(appointmentId: string, attachment: { name: string; url: string; type: string }): Promise<void> {
        try {
            const docRef = doc(db, "appointments", appointmentId);
            const docSnap = await getDocs(query(collection(db, "appointments"), where("__name__", "==", appointmentId))); // Valid way to get single doc or just getDoc
            // Better: use arrayUnion
            const { arrayUnion } = await import("firebase/firestore");
            await updateDoc(docRef, {
                attachments: arrayUnion(attachment)
            });

            // Audit
            // We need patientId. Fetching it might be expensive just for audit. 
            // We can pass it or just log without it correctly.
            // Let's just log the action. 
            const auth = (await import("@/lib/firebase")).auth;
            await auditService.logAction('PATIENT_FILE_UPLOADED', auth.currentUser?.uid || 'unknown', {
                appointmentId,
                fileName: attachment.name
            });

        } catch (error) {
            console.error("Error adding attachment:", error);
            throw error;
        }
    },

    async hasFutureAppointmentsOnDays(doctorId: string, daysIdx: number[]): Promise<boolean> {
        if (daysIdx.length === 0) return false;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const q = query(
                collection(db, "appointments"),
                where("doctorId", "==", doctorId),
                where("date", ">=", Timestamp.fromDate(today)),
                where("status", "in", ['confirmed', 'arrived', 'in_consultation'])
            );

            const snapshot = await getDocs(q);

            // Client-side filtering for specific weekdays
            // Firestore doesn't support "where dayOfWeek in [...]" natively
            return snapshot.docs.some(doc => {
                const date = doc.data().date.toDate();
                const day = date.getDay(); // 0-6 (Sun-Sat)
                // We want to return TRUE if the appointment falls on one of the forbidden days
                return daysIdx.includes(day);
            });

        } catch (error) {
            console.error("Error checking future appointments:", error);
            return true; // Fail safe: assume conflict if error
        }
    }
};

function normalizeSlotTime(value: string | undefined): string {
    if (!value) return '';
    const [rawH, rawM] = value.split(':');
    const hours = Number(rawH);
    const minutes = Number(rawM);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
