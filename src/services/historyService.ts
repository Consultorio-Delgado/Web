import { db } from "@/lib/firebase";
import { Appointment, UserProfile } from "@/types";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";

export const historyService = {
    async getPatientHistory(patientId: string): Promise<Appointment[]> {
        const q = query(
            collection(db, "appointments"),
            where("patientId", "==", patientId),
            orderBy("date", "desc") // Recent first
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    },

    async getPatientProfile(patientId: string): Promise<UserProfile | null> {
        const docRef = doc(db, "users", patientId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
        }
        return null;
    }
};
