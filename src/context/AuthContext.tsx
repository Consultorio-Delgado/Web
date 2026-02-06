"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userService } from "@/services/user";
import { UserProfile } from "@/types";
import Cookies from "js-cookie";

interface AuthContextType {
    user: User | null; // Firebase Auth User
    profile: UserProfile | null; // Firestore Profile
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    refreshProfile: async () => { },
    logout: async () => { },
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

    // ...

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                // Sync session to cookie for Middleware
                const token = await firebaseUser.getIdToken();
                // Set cookie that expires in 1 day
                Cookies.set("session", token, { expires: 1, path: '/' });

                await fetchProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setProfile(null);
                Cookies.remove("session", { path: '/' });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ...

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        Cookies.remove("session", { path: '/' });
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, error, refreshProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
