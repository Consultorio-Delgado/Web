import { db } from "@/lib/firebase";
import { DayOff } from "@/types";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

const COLLECTION_NAME = "exceptions";

export const exceptionService = {
    async getAll(): Promise<DayOff[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayOff));
    },

    async getByDate(date: string): Promise<DayOff[]> {
        const q = query(collection(db, COLLECTION_NAME), where("date", "==", date));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayOff));
    },

    async addDayOff(dayOff: Omit<DayOff, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), dayOff);
        return docRef.id;
    },

    async removeDayOff(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
