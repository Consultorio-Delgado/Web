import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile, Role } from "@/types";

export const userService = {
    /**
     * Fetches the user profile from Firestore by UID.
     */
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    /**
     * Creates or overwrites a user profile.
     * Useful during registration.
     */
    async createUserProfile(uid: string, data: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<void> {
        try {
            await setDoc(doc(db, "users", uid), {
                uid,
                ...data,
                createdAt: new Date(), // Firestore will store this, ensure we handle dates correctly on read
                role: 'patient', // Default role
            });
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    /**
     * Updates specific fields of a user profile.
     */
    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        try {
            await updateDoc(doc(db, "users", uid), data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }
};
