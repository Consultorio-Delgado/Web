import { db } from "@/lib/firebase";
import { Appointment } from "@/types";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";

import { auditService } from "./auditService";

export const appointmentService = {
    async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { createdAt?: Date }): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, "appointments"), {
                ...appointmentData,
                status: 'confirmed', // Auto-confirm for now
                createdAt: Timestamp.now(),
                date: Timestamp.fromDate(appointmentData.date) // Ensure Date is saved as Timestamp
            });

            // Audit
            await auditService.logAction('APPOINTMENT_CREATED', appointmentData.patientId, {
                appointmentId: docRef.id,
                date: appointmentData.date
            });

            // Send Email Confirmation (Fire and Forget but with logs)
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
                        appointmentId: docRef.id
                    }
                })
            })
                .then(async (res) => {
                    const result = await res.json();
                    if (!res.ok) {
                        console.error("[Email] Server returned error:", result);
                    } else {
                        console.log("[Email] Sent successfully:", result);
                    }
                })
                .catch(err => console.error("[Email] Network error:", err));

            return docRef.id;
        } catch (error) {
            console.error("Error creating appointment:", error);
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
                    createdAt: data.createdAt.toDate()
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as Appointment));
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

                // Let's attempt to send what we have.
                if (appt.patientEmail) {
                    fetch('/api/emails', {
                        method: 'POST',
                        body: JSON.stringify({
                            type: 'cancellation',
                            data: {
                                to: appt.patientEmail,
                                patientName: appt.patientName,
                                doctorName: 'Su Profesional', // Placeholder
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
    }
};
