import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { collection, getDocs } from "firebase/firestore";

const CACHE_TIME = 1000 * 60 * 60; // 1 hour
let cachedDoctors: Doctor[] | null = null;
let lastFetch = 0;

export const doctorService = {
    async getAll(): Promise<Doctor[]> {
        const now = Date.now();
        if (cachedDoctors && (now - lastFetch < CACHE_TIME)) {
            return cachedDoctors;
        }

        try {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            const doctors = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Doctor[];

            cachedDoctors = doctors;
            lastFetch = now;
            return doctors;
        } catch (error) {
            console.error("Error fetching doctors:", error);
            return [];
        }
    }
};
