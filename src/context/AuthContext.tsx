"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
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
    const initialLoadDone = useRef(false);
    const userUidRef = useRef<string | null>(null);

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
        console.log("[AuthContext] Mounting...");
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("[AuthContext] onAuthStateChanged:", firebaseUser?.uid || 'null');
            if (firebaseUser) {
                const isSameUser = userUidRef.current === firebaseUser.uid;

                // Only show loading on the very first auth check
                if (!initialLoadDone.current) {
                    setLoading(true);
                }

                // Only update user state if it's a NEW user (avoids cascading re-renders)
                if (!isSameUser) {
                    console.log("[AuthContext] New user detected, updating state.");
                    setUser(firebaseUser);
                    userUidRef.current = firebaseUser.uid;
                }

                // Always refresh the session cookie silently
                const token = await firebaseUser.getIdToken();
                Cookies.set("session", token, { expires: 1, path: '/' });
                console.log("[AuthContext] Session cookie set.");

                // Only fetch profile for new users (not on token refresh)
                if (!isSameUser) {
                    await fetchProfile(firebaseUser.uid);
                }

                if (!initialLoadDone.current) {
                    initialLoadDone.current = true;
                    setLoading(false);
                    console.log("[AuthContext] Initial load done. Loading set to false.");
                }
            } else {
                console.log("[AuthContext] No user. Clearing state.");
                setUser(null);
                setProfile(null);
                userUidRef.current = null;
                Cookies.remove("session", { path: '/' });
                initialLoadDone.current = true;
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        userUidRef.current = null;
        Cookies.remove("session", { path: '/' });
    };

    // Memoize context value to prevent unnecessary re-renders of consumers
    // when AuthProvider re-renders due to layout/children changes
    const value = useMemo(() => ({
        user, profile, loading, error, refreshProfile, logout
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [user, profile, loading, error]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
