import { db } from "@/lib/firebase";
import { Appointment } from "@/types";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";

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
    }
};
