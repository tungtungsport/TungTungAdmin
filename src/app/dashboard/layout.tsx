"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthProvider } from "@/context/AuthContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const sidebarWidth = sidebarCollapsed ? 72 : 256;

    return (
        <div className="min-h-screen bg-[#0A1A13]">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <Topbar sidebarCollapsed={sidebarCollapsed} />
            <div
                style={{
                    marginLeft: `${sidebarWidth}px`,
                    paddingTop: '80px',
                    transition: 'margin-left 0.3s ease'
                }}
            >
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
