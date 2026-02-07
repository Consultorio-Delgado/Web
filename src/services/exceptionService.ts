import { db } from "@/lib/firebase";
import { DayOff } from "@/types";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";

export const exceptionService = {
    // Get all exceptions for a specific doctor
    async getDoctorExceptions(doctorId: string): Promise<DayOff[]> {
        try {
            const q = query(collection(db, "exceptions"), where("doctorId", "==", doctorId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayOff));
        } catch (error) {
            console.error("Error fetching exceptions:", error);
            return [];
        }
    },

    // Block a day
    async createException(exception: Omit<DayOff, "id">): Promise<void> {
        try {
            const newDocRef = doc(collection(db, "exceptions"));
            await setDoc(newDocRef, { ...exception, id: newDocRef.id });
        } catch (error) {
            console.error("Error creating exception:", error);
            throw error;
        }
    },

    // Unblock a day
    async deleteException(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, "exceptions", id));
        } catch (error) {
            console.error("Error deleting exception:", error);
            throw error;
        }
    }
};
