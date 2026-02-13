import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile, Role } from "@/types";

export const userService = {
    /**
     * Fetches the user profile from Firestore by UID.
     */
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            // Optimization: Check if user is a doctor first (or in parallel) to avoid 'users' permission issues
            // and to use the correct source of truth for doctors.
            const [doctorSnap, userSnap] = await Promise.all([
                getDoc(doc(db, "doctors", uid)),
                getDoc(doc(db, "users", uid))
            ]);

            if (doctorSnap.exists()) {
                const doctorData = doctorSnap.data();
                return {
                    uid: doctorSnap.id,
                    email: doctorData.email,
                    firstName: doctorData.firstName,
                    lastName: doctorData.lastName,
                    role: 'doctor', // Enforce role based on collection
                    createdAt: doctorData.createdAt
                } as UserProfile;
            }

            if (userSnap.exists()) {
                return userSnap.data() as UserProfile;
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
    },

    /**
     * Marks a doctor as visited by the patient.
     * Prevents duplicates.
     */
    async markDoctorAsVisited(uid: string, doctorId: string): Promise<void> {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                const visitedDoctors = userData.visitedDoctors || [];

                if (!visitedDoctors.includes(doctorId)) {
                    await updateDoc(userRef, {
                        visitedDoctors: [...visitedDoctors, doctorId]
                    });
                }
            }
        } catch (error) {
            console.error("Error marking doctor as visited:", error);
        }
    }
};
