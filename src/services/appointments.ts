import { db } from "@/lib/firebase";
import { Appointment } from "@/types";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

export const appointmentService = {
    async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { createdAt?: Date }): Promise<string> {
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
    }
};
