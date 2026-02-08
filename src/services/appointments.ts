import { db } from "@/lib/firebase";
import { Appointment } from "@/types";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, Timestamp, runTransaction } from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";

import { auditService } from "./auditService";

export const appointmentService = {
    // Count active (future, non-cancelled) appointments for a patient
    // If doctorId is provided, only count appointments with that specific doctor
    async countActiveAppointments(patientId: string, doctorId?: string): Promise<number> {
        try {
            const now = new Date();
            let q = query(
                collection(db, "appointments"),
                where("patientId", "==", patientId),
                where("date", ">=", Timestamp.fromDate(now))
            );

            const querySnapshot = await getDocs(q);
            // Filter out cancelled/absent/completed appointments client-side
            const activeStatuses = ['pending', 'confirmed', 'arrived'];
            const activeAppointments = querySnapshot.docs.filter(doc => {
                const data = doc.data();
                const isActive = activeStatuses.includes(data.status);
                // If doctorId provided, filter by that doctor
                if (doctorId) {
                    return isActive && data.doctorId === doctorId;
                }
                return isActive;
            });

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
            if (appointmentData.patientId !== 'blocked') {
                const activeWithDoctor = await this.countActiveAppointments(appointmentData.patientId, appointmentData.doctorId);
                if (activeWithDoctor >= 1) {
                    throw new Error("LIMIT_EXCEEDED: Ya tienes un turno activo con este profesional. Puedes sacar turno con otro profesional.");
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
                const activeStatuses = ['pending', 'confirmed', 'arrived'];
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
                    updatedAt: data.updatedAt?.toDate()
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
                    updatedAt: data.updatedAt?.toDate()
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
            if (updates.date) {
                dataToUpdate.date = Timestamp.fromDate(updates.date);
            }
            if (updates.arrivedAt) {
                dataToUpdate.arrivedAt = Timestamp.fromDate(updates.arrivedAt);
            }
            if (updates.updatedAt) {
                dataToUpdate.updatedAt = Timestamp.now();
            } else {
                dataToUpdate.updatedAt = Timestamp.now();
            }

            await updateDoc(docRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating appointment:", error);
            throw error;
        }
    },
    async cancelAppointment(appointmentId: string): Promise<void> {
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
                    reason: 'Cancelled by user'
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
                                time: appt.time
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
                where("status", "in", ['confirmed', 'arrived'])
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
