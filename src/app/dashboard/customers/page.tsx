"use client";

import { supabase } from "@/lib/supabase";
import { Search, Loader2, User, Package, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface Customer {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    status: string;
    created_at: string;
    order_count: number;
    last_order_date: string | null;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('all');

    useEffect(() => {
        fetchCustomers();
    }, [getDateRange]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        const { startDate, endDate } = getDateRange;

        // Fetch customers (profiles with role = 'customer') with order counts
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });

        // Apply date filter if not "all"
        if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data: profiles, error: profilesError } = await query;

        if (profilesError) {
            console.error('Error fetching customers:', profilesError);
            setIsLoading(false);
            return;
        }

        // For each customer, get their order count
        const customersWithOrders = await Promise.all(
            (profiles || []).map(async (profile) => {
                const { count, data: orders } = await supabase
                    .from('orders')
                    .select('created_at', { count: 'exact', head: false })
                    .eq('customer_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    status: profile.status,
                    created_at: profile.created_at,
                    order_count: count || 0,
                    last_order_date: orders?.[0]?.created_at || null
                };
            })
        );

        setCustomers(customersWithOrders);
        setIsLoading(false);
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch =
            (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone || '').includes(searchQuery);
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return "bg-[#1E7F43]/20 text-[#7CFF9B]";
        }
        return "bg-gray-600/20 text-gray-400";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Pelanggan</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">{filteredCustomers.length} pelanggan ditampilkan</p>
                </div>
                <DateFilter
                    filterPeriod={filterPeriod}
                    setFilterPeriod={setFilterPeriod}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />
            </div>

            {/* Search */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4">
                <div className="relative max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="h-4 w-4 text-[#BFD3C6]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Pelanggan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A4D35]">
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pelanggan</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Email</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Telepon</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pesanan</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pesanan Terakhir</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-[#BFD3C6]">
                                    Tidak ada pelanggan ditemukan.
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#1E7F43] flex items-center justify-center text-white text-sm font-bold">
                                                {(customer.name || customer.email).charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white font-medium">
                                                {customer.name || 'Tanpa Nama'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-[#BFD3C6]">{customer.email}</td>
                                    <td className="py-4 px-4 text-[#BFD3C6]">{customer.phone || '-'}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-[#BFD3C6]" />
                                            <span className="font-numeric text-white">{customer.order_count}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-[#BFD3C6] font-numeric">
                                        {customer.last_order_date
                                            ? new Date(customer.last_order_date).toLocaleDateString('id-ID')
                                            : '-'
                                        }
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${getStatusBadge(customer.status)}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
