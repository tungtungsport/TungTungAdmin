"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Heart,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    RotateCcw
} from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Returns", href: "/dashboard/returns", icon: RotateCcw },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 h-screen bg-[#0F2A1E] border-r border-[#1A4D35] z-50 flex flex-col"
            style={{ width: collapsed ? '72px' : '256px', transition: 'width 0.3s ease' }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center border-b border-[#1A4D35] px-4 flex-shrink-0">
                {collapsed ? (
                    <div className="w-10 h-10 bg-[#0F3D2E] border border-[#7CFF9B] flex items-center justify-center mx-auto">
                        <span className="font-heading text-lg text-[#7CFF9B]">T</span>
                    </div>
                ) : (
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0F3D2E] border border-[#7CFF9B] flex items-center justify-center flex-shrink-0">
                            <span className="font-heading text-lg text-[#7CFF9B]">T</span>
                        </div>
                        <span className="font-heading text-sm text-white whitespace-nowrap">
                            TUNG TUNG <span className="text-[#7CFF9B]">ADMIN</span>
                        </span>
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto">
                <div className="flex flex-col gap-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-sm transition-colors ${isActive
                                    ? "bg-[#1E7F43] text-white"
                                    : "text-[#BFD3C6] hover:bg-[#1A4D35] hover:text-white"
                                    } ${collapsed ? "justify-center" : ""}`}
                                title={collapsed ? item.name : undefined}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && (
                                    <span className="font-heading text-xs uppercase tracking-wider">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Collapse Toggle */}
            <div className="flex-shrink-0 p-3 border-t border-[#1A4D35]">
                <button
                    onClick={onToggle}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-[#BFD3C6] hover:text-white hover:bg-[#1A4D35] transition-colors rounded-sm ${collapsed ? "justify-center" : ""}`}
                >
                    {collapsed ? <ChevronRight className="h-5 w-5" /> : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="font-heading text-xs uppercase tracking-wider">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
