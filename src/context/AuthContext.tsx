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

    // Track the last processed session to prevent redundant fetches
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);

    // Fetch user profile and verify admin role
    const fetchAdminProfile = async (authUser: User) => {
        try {
            console.log('Fetching admin profile for:', authUser.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) {
                console.error('Database error fetching profile:', {
                    code: error.code,
                    message: error.message,
                    details: error.details
                });
                return null;
            }

            if (!data) {
                console.warn('No profile found for authenticated user:', authUser.id);
                return null;
            }

            // Verify admin role
            if (data.role !== 'admin') {
                console.warn('User is not an admin:', data.email, 'Role:', data.role);
                return null;
            }

            return {
                id: data.id,
                email: data.email,
                name: data.name,
                role: data.role
            } as AdminUser;
        } catch (err) {
            console.error('Unexpected error in fetchAdminProfile:', err);
            return null;
        }
    };

    // Initialize auth state
    useEffect(() => {
        let isMounted = true;

        const syncAuth = async (session: Session | null) => {
            const sessionId = session?.user?.id || null;

            // Deduplicate: Don't re-process if the user ID hasn't changed
            if (sessionId === lastSessionId && (sessionId !== null || user !== null)) {
                return;
            }

            if (session?.user) {
                setLastSessionId(session.user.id);
                const adminProfile = await fetchAdminProfile(session.user);

                if (!isMounted) return;

                if (adminProfile) {
                    setUser(adminProfile);
                    setIsAuthenticated(true);
                } else {
                    // Not an admin or error fetching profile, sign out
                    setUser(null);
                    setIsAuthenticated(false);
                    await supabase.auth.signOut();
                }
            } else {
                setLastSessionId(null);
                setUser(null);
                setIsAuthenticated(false);
            }

            if (isMounted) setIsLoading(false);
        };

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) syncAuth(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (isMounted) syncAuth(session);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [lastSessionId, user]);

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
