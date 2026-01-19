"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, Bell, User } from "lucide-react";

interface TopbarProps {
    sidebarCollapsed?: boolean;
}

export function Topbar({ sidebarCollapsed = false }: TopbarProps) {
    const { user, signOut } = useAuth();

    const sidebarWidth = sidebarCollapsed ? 72 : 256;

    return (
        <header
            className="fixed top-0 right-0 h-16 bg-[#0F2A1E] border-b border-[#1A4D35] flex items-center justify-between px-6 z-40"
            style={{
                left: `${sidebarWidth}px`,
                transition: 'left 0.3s ease'
            }}
        >
            {/* Left side - Page Title */}
            <div>
                <h1 className="font-heading text-white text-lg uppercase tracking-wide">Dashboard</h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative text-[#BFD3C6] hover:text-white p-2 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#D64545] rounded-full" />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-4 border-l border-[#1A4D35]">
                    <div className="w-9 h-9 bg-[#1E7F43] flex items-center justify-center rounded-sm">
                        <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-white text-sm font-bold">{user?.name || "Admin"}</p>
                        <p className="text-[#BFD3C6] text-xs uppercase">{user?.role || "Admin"}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="text-[#BFD3C6] hover:text-[#D64545] p-2 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
