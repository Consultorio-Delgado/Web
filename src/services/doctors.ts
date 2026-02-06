import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const CACHE_TIME = 1000 * 60 * 60; // 1 hour
let cachedDoctors: Doctor[] | null = null;
let lastFetch = 0;

export const doctorService = {
    async getAll(): Promise<Doctor[]> {
        // Cache logic can remain but for admin we might want freshness. 
        // For now, let's bypass cache to ensure updates are seen immediately or invalidate it.
        try {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Doctor[];
        } catch (error) {
            console.error("Error fetching doctors:", error);
            return [];
        }
    },

    async createDoctor(data: Omit<Doctor, 'id'>): Promise<void> {
        try {
            await addDoc(collection(db, "doctors"), data);
            cachedDoctors = null; // Invalidate cache
        } catch (error) {
            console.error("Error creating doctor:", error);
            throw error;
        }
    },

    async updateDoctor(id: string, data: Partial<Doctor>): Promise<void> {
        try {
            await updateDoc(doc(db, "doctors", id), data);
            cachedDoctors = null; // Invalidate cache
        } catch (error) {
            console.error("Error updating doctor:", error);
            throw error;
        }
    },

    async deleteDoctor(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, "doctors", id));
            cachedDoctors = null; // Invalidate cache
        } catch (error) {
            console.error("Error deleting doctor:", error);
            throw error;
        }
    }
};
