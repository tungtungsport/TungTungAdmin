"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, AlertCircle, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const { signUp, isAuthenticated, isLoading: authLoading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

        if (password.length < 6) {
            setError("Password harus minimal 6 karakter");
            return;
        }

        if (password !== confirmPassword) {
            setError("Password tidak cocok");
            return;
        }

        setIsLoading(true);

        const { error } = await signUp(email, password, name);

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
                        TUNG TUNG SPORT
                    </h1>
                    <p className="text-[#BFD3C6] text-lg max-w-md">
                        Admin Panel - Daftar akun admin baru untuk mengelola toko.
                    </p>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F2A1E] border-2 border-[#7CFF9B] mb-4">
                            <span className="font-heading text-3xl text-[#7CFF9B]">T</span>
                        </div>
                        <h1 className="font-heading text-2xl text-white">ADMIN PANEL</h1>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2 className="font-heading text-2xl text-white uppercase tracking-wide mb-2">
                            Daftar Admin
                        </h2>
                        <p className="text-[#BFD3C6] text-sm">
                            Buat akun admin baru untuk mengakses dashboard.
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[#BFD3C6] text-xs uppercase tracking-wider font-bold mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#0F2A1E] border border-[#1A4D35] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                                placeholder="Nama admin"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-[#BFD3C6] text-xs uppercase tracking-wider font-bold mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0F2A1E] border border-[#1A4D35] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                                placeholder="admin@email.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-[#BFD3C6] text-xs uppercase tracking-wider font-bold mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0F2A1E] border border-[#1A4D35] text-white px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                                    placeholder="Minimal 6 karakter"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFD3C6] hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[#BFD3C6] text-xs uppercase tracking-wider font-bold mb-2">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#0F2A1E] border border-[#1A4D35] text-white px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                                    placeholder="Ulangi password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFD3C6] hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#1E7F43] hover:bg-[#28A055] text-white font-bold py-3 px-4 uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    Daftar Admin
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[#BFD3C6] text-sm mt-6">
                        Sudah punya akun?{" "}
                        <Link href="/login" className="text-[#7CFF9B] hover:underline">
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
