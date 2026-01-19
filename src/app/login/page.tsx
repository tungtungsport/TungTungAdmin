"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, AlertCircle, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, authLoading, router]);

    if (isAuthenticated && !authLoading) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#0A1A13" }}>
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F3D2E] to-[#0A1A13] items-center justify-center p-12 relative overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(124, 255, 155, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 255, 155, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* Content */}
                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0F2A1E] border-2 border-[#7CFF9B] mb-8">
                        <span className="font-heading text-5xl text-[#7CFF9B]">T</span>
                    </div>
                    <h1 className="font-heading text-4xl text-white tracking-tight mb-4">
                        TUNG TUNG <span className="text-[#7CFF9B]">SPORT</span>
                    </h1>
                    <p className="text-[#BFD3C6] text-lg max-w-sm">
                        Admin Dashboard for Managing Your Premium Futsal & Football Store
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F3D2E] border-2 border-[#7CFF9B] mb-4">
                            <span className="font-heading text-2xl text-[#7CFF9B]">T</span>
                        </div>
                        <h1 className="font-heading text-xl text-white tracking-tight">
                            TUNG TUNG <span className="text-[#7CFF9B]">SPORT</span>
                        </h1>
                    </div>

                    {/* Login Card */}
                    <div className="bg-[#0F2A1E] border border-[#1A4D35] p-8 rounded-sm">
                        <div className="mb-8">
                            <h2 className="font-heading text-2xl text-white uppercase tracking-wide">Admin Login</h2>
                            <p className="text-[#BFD3C6] text-sm mt-2">Enter your admin credentials to access the dashboard</p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-[#D64545]/10 border border-[#D64545]/30 px-4 py-3 mb-6 text-[#D64545] text-sm rounded-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[#BFD3C6] text-xs font-bold uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#7CFF9B] transition-colors rounded-sm"
                                    placeholder="admin@tungtungsport.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[#BFD3C6] text-xs font-bold uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#7CFF9B] transition-colors rounded-sm"
                                        placeholder="Enter password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BFD3C6] hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1E7F43] hover:bg-[#2a9954] text-white font-bold uppercase tracking-wider py-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 rounded-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#1A4D35]">
                            <p className="text-center text-[#BFD3C6] text-sm mb-4">
                                Belum punya akun admin?{" "}
                                <a href="/signup" className="text-[#7CFF9B] hover:underline">
                                    Daftar
                                </a>
                            </p>
                            <p className="text-center text-[#BFD3C6] text-xs">
                                Only users with <span className="text-[#7CFF9B] font-bold">admin</span> role can access this panel.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
