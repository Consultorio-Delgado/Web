import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Helper to remove undefined fields recursively
function cleanUndefined(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => cleanUndefined(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = cleanUndefined(value);
            }
            return acc;
        }, {} as any);
    }
    return obj;
}

export const doctorService = {
    async getAllDoctors(): Promise<Doctor[]> {
        try {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Doctor));
        } catch (error) {
            console.error("Error fetching doctors:", error);
            return [];
        }
    },

    async getDoctorById(id: string): Promise<Doctor | null> {
        try {
            const docRef = doc(db, "doctors", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Doctor;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching doctor ${id}:`, error);
            return null;
        }
    },

    async updateDoctor(id: string, data: Partial<Doctor>): Promise<void> {
        try {
            const docRef = doc(db, "doctors", id);
            const safeData = cleanUndefined(data);
            await updateDoc(docRef, safeData);
        } catch (error) {
            console.error(`Error updating doctor ${id}:`, error);
            throw error;
        }
    },

    // Create doctor if not exists (for seeding/admin)
    async createDoctor(doctor: Doctor): Promise<void> {
        try {
            const safeData = cleanUndefined(doctor);
            await setDoc(doc(db, "doctors", doctor.id), safeData, { merge: true });
        } catch (error) {
            console.error(`Error creating doctor ${doctor.id}:`, error);
            throw error;
        }
    },

    async deleteDoctor(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, "doctors", id));
        } catch (error) {
            console.error(`Error deleting doctor ${id}:`, error);
            throw error;
        }
    }
};
