import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface ClinicSettings {
    name: string;
    phone: string;
    logoUrl?: string;
    address?: string;
}

const SETTINGS_DOC_PATH = "settings/general";

export const settingsService = {
    async getSettings(): Promise<ClinicSettings> {
        try {
            const docRef = doc(db, SETTINGS_DOC_PATH);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return snapshot.data() as ClinicSettings;
            } else {
                // Default settings
                return {
                    name: "Consultorio Delgado",
                    phone: "+54 11 1234-5678",
                    address: "Delgado 588, 1°C (1426) CABA"
                };
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Fallback
            return {
                name: "Consultorio Delgado",
                phone: "",
            };
        }
    },

    async updateSettings(settings: Partial<ClinicSettings>): Promise<void> {
        try {
            const docRef = doc(db, SETTINGS_DOC_PATH);
            // Use setDoc with merge to ensure document creation if missing
            await setDoc(docRef, settings, { merge: true });
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }
};
