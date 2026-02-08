import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";

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
            // Filter out soft-deleted doctors
            const q = query(
                collection(db, "doctors"),
                where("isDeleted", "!=", true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Doctor));
        } catch (error) {
            console.error("Error fetching doctors:", error);
            // Fallback: get all and filter client-side (for backwards compatibility with existing data)
            try {
                const allDocs = await getDocs(collection(db, "doctors"));
                return allDocs.docs
                    .filter(doc => !doc.data().isDeleted)
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Doctor));
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                return [];
            }
        }
    },

    async getDoctorById(id: string): Promise<Doctor | null> {
        try {
            const docRef = doc(db, "doctors", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Return null if soft-deleted
                if (data.isDeleted) {
                    return null;
                }
                return { id: docSnap.id, ...data } as Doctor;
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
            const safeData = cleanUndefined({ ...doctor, isDeleted: false });
            await setDoc(doc(db, "doctors", doctor.id), safeData, { merge: true });
        } catch (error) {
            console.error(`Error creating doctor ${doctor.id}:`, error);
            throw error;
        }
    },

    // Soft delete - mark as deleted instead of removing
    async deleteDoctor(id: string): Promise<void> {
        try {
            const docRef = doc(db, "doctors", id);
            await updateDoc(docRef, {
                isDeleted: true,
                deletedAt: new Date()
            });
        } catch (error) {
            console.error(`Error soft-deleting doctor ${id}:`, error);
            throw error;
        }
    },

    // Restore a soft-deleted doctor (admin function)
    async restoreDoctor(id: string): Promise<void> {
        try {
            const docRef = doc(db, "doctors", id);
            await updateDoc(docRef, {
                isDeleted: false,
                deletedAt: null,
                restoredAt: new Date()
            });
        } catch (error) {
            console.error(`Error restoring doctor ${id}:`, error);
            throw error;
        }
    },

    // Get all doctors including deleted (for admin recovery)
    async getAllDoctorsIncludingDeleted(): Promise<Doctor[]> {
        try {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Doctor));
        } catch (error) {
            console.error("Error fetching all doctors:", error);
            return [];
        }
    }
};
