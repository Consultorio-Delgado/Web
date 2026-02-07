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

            // Update the doc with its own ID (optional but helpful)
            await updateDoc(doc(db, "appointments", docRef.id), { id: docRef.id });

            // Audit
            await auditService.logAction('APPOINTMENT_CREATED', appointmentData.patientId, {
                appointmentId: docRef.id,
                date: appointmentData.date
            });

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
