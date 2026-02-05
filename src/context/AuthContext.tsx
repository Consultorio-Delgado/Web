"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userService } from "@/services/user";
import { UserProfile } from "@/types";

interface AuthContextType {
    user: User | null; // Firebase Auth User
    profile: UserProfile | null; // Firestore Profile
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async (uid: string) => {
        try {
            const userProfile = await userService.getUserProfile(uid);
            setProfile(userProfile);
        } catch (err) {
            console.error(err);
            setError("Error al cargar el perfil de usuario.");
            setProfile(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                // Sync session to cookie for Middleware
                const token = await firebaseUser.getIdToken();
                document.cookie = `session=${token}; path=/; max-age=3600; SameSite=Strict`; // Expires in 1 hour

                await fetchProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setProfile(null);
                // Clear cookie
                document.cookie = `session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, error, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
