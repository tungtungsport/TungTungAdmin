"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AdminUser | null;
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AdminUser | null>(null);
    const router = useRouter();

    // Fetch user profile and verify admin role
    const fetchAdminProfile = async (authUser: User) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !data) {
            console.error('Error fetching profile:', error);
            return null;
        }

        // Verify admin role
        if (data.role !== 'admin') {
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role
        } as AdminUser;
    };

    // Initialize auth state
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const adminProfile = await fetchAdminProfile(session.user);
                if (adminProfile) {
                    setUser(adminProfile);
                    setIsAuthenticated(true);
                } else {
                    // Not an admin, sign out
                    await supabase.auth.signOut();
                }
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const adminProfile = await fetchAdminProfile(session.user);
                    if (adminProfile) {
                        setUser(adminProfile);
                        setIsAuthenticated(true);
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: 'admin' }
            }
        });

        if (authError) {
            return { error: new Error(authError.message) };
        }

        // Wait a moment for the trigger to create the profile
        if (data.user) {
            // Small delay to allow trigger to execute
            await new Promise(resolve => setTimeout(resolve, 500));

            const adminProfile = await fetchAdminProfile(data.user);
            if (adminProfile) {
                setUser(adminProfile);
                setIsAuthenticated(true);
            }
        }

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return { error: new Error(authError.message) };
        }

        if (data.user) {
            const adminProfile = await fetchAdminProfile(data.user);
            if (!adminProfile) {
                await supabase.auth.signOut();
                return { error: new Error("Akun ini bukan admin. Silakan gunakan akun admin.") };
            }
            setUser(adminProfile);
            setIsAuthenticated(true);
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
