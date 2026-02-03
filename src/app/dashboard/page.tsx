"use client";

import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, Heart, Loader2, BarChart3, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

// Filter types
type FilterPeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'specific_month' | 'specific_date';
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
};

interface DashboardStats {
    totalSales: number;
    totalOrders: number;
    lowStockProducts: number;
    totalFavorites: number;
}

interface TopProduct {
    id: string;
    name: string;
    brand: string;
    favorite_count: number;
}

interface BestSeller {
    product_id: string;
    product_name: string;
    total_sold: number;
}

interface DailySales {
    day: string;
    sales: number;
}

interface MonthlySales {
    month: string;
    sales: number;
    cumulative: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    customer_name: string;
    created_at: string;
    total: number;
    status: string;
}

// Stat card component
function StatCard({ title, value, trend, icon: Icon, color = "accent" }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: React.ElementType;
    color?: "accent" | "warning" | "danger";
}) {
    const colorClasses = {
        accent: "text-[#7CFF9B]",
        warning: "text-[#F2E94E]",
        danger: "text-[#D64545]"
    };

    return (
        <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5 flex items-start justify-between">
            <div>
                <p className="text-[#BFD3C6] text-xs uppercase tracking-wider mb-2">{title}</p>
                <p className={`font-numeric text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-[#7CFF9B]" : "text-[#D64545]"}`}>
                        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{trend >= 0 ? "+" : ""}{trend}%</span>
                    </div>
                )}
            </div>
            <div className={`p-3 bg-[#0A1A13] ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        totalOrders: 0,
        lowStockProducts: 0,
        totalFavorites: 0
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
    const [dailySales, setDailySales] = useState<DailySales[]>([]);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter state
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);


    // Calculate date range based on filter
    const getDateRange = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (filterPeriod) {
            case 'all':
                return { startDate: null, endDate: null };
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'weekly':
                const dayOfWeek = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            case 'specific_month':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                break;
            case 'specific_date':
                const date = new Date(selectedDate);
                startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
                break;
        }

        return {
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null
        };
    }, [filterPeriod, selectedMonth, selectedYear, selectedDate]);

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            const { startDate, endDate } = getDateRange;

            // Fetch total sales (sum of completed orders) within date range
            let salesQuery = supabase
                .from('orders')
                .select('total')
                .eq('status', 'SELESAI');

            if (startDate && endDate) {
                salesQuery = salesQuery.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data: salesData } = await salesQuery;
            const totalSales = salesData?.reduce((sum, o) => sum + o.total, 0) || 0;

            // Fetch total orders count within date range
            let ordersQuery = supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            if (startDate && endDate) {
                ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { count: totalOrders } = await ordersQuery;


            // Fetch low stock products (stock <= 5)
            const { count: lowStockProducts } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lte('stock', 5)
                .eq('status', 'active');

            // Fetch total favorites count
            const { count: totalFavorites } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalSales,
                totalOrders: totalOrders || 0,
                lowStockProducts: lowStockProducts || 0,
                totalFavorites: totalFavorites || 0
            });

            // Fetch top favorited products
            const { data: topProductsData } = await supabase
                .from('products')
                .select('id, name, brand, favorite_count')
                .order('favorite_count', { ascending: false })
                .limit(5);
            setTopProducts(topProductsData || []);

            // Fetch best sellers from order_items with date filter
            let orderItemsQuery = supabase
                .from('order_items')
                .select(`
                    product_id, 
                    product_name, 
                    quantity,
                    orders!inner(created_at, status)
                `)
                .eq('orders.status', 'SELESAI');

            // Apply date filter to order_items via orders
            if (startDate && endDate) {
                orderItemsQuery = orderItemsQuery
                    .gte('orders.created_at', startDate)
                    .lte('orders.created_at', endDate);
            }

            const { data: orderItemsData } = await orderItemsQuery;

            // Aggregate best sellers
            const salesMap: Record<string, { name: string; total: number }> = {};
            (orderItemsData || []).forEach((item: any) => {
                if (!salesMap[item.product_id]) {
                    salesMap[item.product_id] = { name: item.product_name, total: 0 };
                }
                salesMap[item.product_id].total += item.quantity;
            });
            const bestSellersArr = Object.entries(salesMap)
                .map(([id, data]) => ({ product_id: id, product_name: data.name, total_sold: data.total }))
                .sort((a, b) => b.total_sold - a.total_sold)
                .slice(0, 5);
            setBestSellers(bestSellersArr);

            // Fetch daily sales - respects filter or defaults to last 7 days
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const salesByDay: DailySales[] = [];

            if (startDate && endDate) {
                // When filtered, show daily breakdown within the filter period
                const start = new Date(startDate);
                const end = new Date(endDate);
                const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const daysToShow = Math.min(daysDiff + 1, 14); // Max 14 days

                for (let i = daysToShow - 1; i >= 0; i--) {
                    const date = new Date(end);
                    date.setDate(end.getDate() - i);
                    const dayStr = date.toISOString().split('T')[0];
                    const { data: daySalesData } = await supabase
                        .from('orders')
                        .select('total')
                        .gte('created_at', `${dayStr}T00:00:00`)
                        .lt('created_at', `${dayStr}T23:59:59`)
                        .eq('status', 'SELESAI');
                    const daySales = daySalesData?.reduce((sum, o) => sum + o.total, 0) || 0;
                    salesByDay.push({ day: `${date.getDate()}/${date.getMonth() + 1}`, sales: daySales });
                }
            } else {
                // Default: last 7 days
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dayStr = date.toISOString().split('T')[0];
                    const { data: daySalesData } = await supabase
                        .from('orders')
                        .select('total')
                        .gte('created_at', `${dayStr}T00:00:00`)
                        .lt('created_at', `${dayStr}T23:59:59`)
                        .eq('status', 'SELESAI');
                    const daySales = daySalesData?.reduce((sum, o) => sum + o.total, 0) || 0;
                    salesByDay.push({ day: days[date.getDay()], sales: daySales });
                }
            }
            setDailySales(salesByDay);

            // Fetch monthly sales - respects filter or defaults to last 6 months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyData: MonthlySales[] = [];
            let cumulative = 0;

            if (filterPeriod === 'specific_month' || filterPeriod === 'specific_date') {
                // Show the selected month and surrounding months
                const targetMonth = filterPeriod === 'specific_month' ? selectedMonth : new Date(selectedDate).getMonth();
                const targetYear = filterPeriod === 'specific_month' ? selectedYear : new Date(selectedDate).getFullYear();

                for (let offset = -2; offset <= 3; offset++) {
                    const date = new Date(targetYear, targetMonth + offset, 1);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
                    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

                    const { data: monthSalesData } = await supabase
                        .from('orders')
                        .select('total')
                        .gte('created_at', startOfMonth)
                        .lte('created_at', endOfMonth)
                        .eq('status', 'SELESAI');

                    const monthTotal = monthSalesData?.reduce((sum, o) => sum + o.total, 0) || 0;
                    cumulative += monthTotal;
                    monthlyData.push({
                        month: months[month],
                        sales: monthTotal,
                        cumulative: cumulative
                    });
                }
            } else {
                // Default: last 6 months
                for (let i = 5; i >= 0; i--) {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
                    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

                    const { data: monthSalesData } = await supabase
                        .from('orders')
                        .select('total')
                        .gte('created_at', startOfMonth)
                        .lte('created_at', endOfMonth)
                        .eq('status', 'SELESAI');

                    const monthTotal = monthSalesData?.reduce((sum, o) => sum + o.total, 0) || 0;
                    cumulative += monthTotal;
                    monthlyData.push({
                        month: months[month],
                        sales: monthTotal,
                        cumulative: cumulative
                    });
                }
            }
            setMonthlySales(monthlyData);


            // Fetch recent orders with customer info
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total,
                    status,
                    created_at,
                    profiles (name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            const formattedOrders: RecentOrder[] = (ordersData || []).map((o: any) => ({
                id: o.id,
                order_number: o.order_number,
                customer_name: o.profiles?.name || o.profiles?.email || 'Unknown',
                created_at: o.created_at,
                total: o.total,
                status: o.status
            }));
            setRecentOrders(formattedOrders);

            setIsLoading(false);
        }

        fetchDashboardData();
    }, [getDateRange]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const maxSales = Math.max(...dailySales.map(d => d.sales), 1);
    const totalWeekSales = dailySales.reduce((sum, d) => sum + d.sales, 0);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Dasbor & Laporan</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">Selamat datang kembali, Admin. Berikut ringkasan toko dan analitik Anda.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-[#7CFF9B]" />
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                            className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="daily">Hari Ini</option>
                            <option value="weekly">Minggu Ini</option>
                            <option value="monthly">Bulan Ini</option>
                            <option value="yearly">Tahun Ini</option>
                            <option value="specific_month">Pilih Bulan</option>
                            <option value="specific_date">Pilih Tanggal</option>
                        </select>

                    </div>

                    {filterPeriod === 'specific_month' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                            >
                                {MONTHS.map((month, idx) => (
                                    <option key={idx} value={idx}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                            >
                                {[2024, 2025, 2026].map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filterPeriod === 'specific_date' && (
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#BFD3C6]" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Penjualan"
                    value={formatCurrency(stats.totalSales)}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Total Pesanan"
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Peringatan Stok Rendah"
                    value={stats.lowStockProducts}
                    icon={AlertTriangle}
                    color="warning"
                />
                <StatCard
                    title="Total Favorit"
                    value={stats.totalFavorites}
                    icon={Heart}
                />
            </div>

            {/* Sales Chart */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-[#7CFF9B]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Penjualan dari Waktu ke Waktu (7 Hari Terakhir)</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[#BFD3C6] text-xs">Total Mingguan</p>
                        <p className="font-numeric text-[#7CFF9B] font-bold">{formatCurrency(totalWeekSales)}</p>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-3 h-48">
                    {dailySales.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end h-40">
                                <div
                                    className="w-full bg-[#1E7F43] hover:bg-[#7CFF9B] transition-colors cursor-pointer group relative"
                                    style={{ height: `${(data.sales / maxSales) * 100}%`, minHeight: '8px' }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A1A13] border border-[#1A4D35] px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                                        {formatCurrency(data.sales)}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[#BFD3C6] text-xs font-bold">{data.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Total Sales Chart */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-[#7CFF9B]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Tren Total Penjualan (6 Bulan Terakhir)</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[#BFD3C6] text-xs">Total Kumulatif</p>
                        <p className="font-numeric text-[#7CFF9B] font-bold">
                            {formatCurrency(monthlySales[monthlySales.length - 1]?.cumulative || 0)}
                        </p>
                    </div>
                </div>
                <div className="relative">
                    {/* Bar Chart with Cumulative Line */}
                    <div className="flex items-end justify-between gap-4 h-48">
                        {monthlySales.map((data, i) => {
                            const maxMonthSales = Math.max(...monthlySales.map(d => d.sales), 1);
                            const maxCumulative = monthlySales[monthlySales.length - 1]?.cumulative || 1;
                            const barHeight = (data.sales / maxMonthSales) * 100;
                            const lineY = 100 - ((data.cumulative / maxCumulative) * 80);

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 relative">
                                    <div className="w-full flex flex-col items-center justify-end h-40 relative">
                                        {/* Bar */}
                                        <div
                                            className="w-full bg-[#1E7F43] hover:bg-[#7CFF9B] transition-colors cursor-pointer group relative"
                                            style={{ height: `${barHeight}%`, minHeight: '8px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A1A13] border border-[#1A4D35] px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                                                {formatCurrency(data.sales)}
                                            </div>
                                        </div>
                                        {/* Cumulative dot */}
                                        <div
                                            className="absolute w-3 h-3 bg-cyan-400 rounded-full border-2 border-white shadow-lg z-20 group cursor-pointer"
                                            style={{ bottom: `${(data.cumulative / maxCumulative) * 80}%`, left: '50%', transform: 'translateX(-50%)' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A1A13] border border-cyan-500/50 px-2 py-1 text-xs text-cyan-400 whitespace-nowrap z-30">
                                                Total: {formatCurrency(data.cumulative)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[#BFD3C6] text-xs font-bold">{data.month}</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#1A4D35]">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-[#1E7F43] rounded-sm"></div>
                            <span className="text-[#BFD3C6] text-xs">Penjualan Bulanan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                            <span className="text-[#BFD3C6] text-xs">Total Kumulatif</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Selling Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ShoppingCart className="h-5 w-5 text-[#7CFF9B]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Produk Terlaris</h3>
                    </div>
                    {bestSellers.length === 0 ? (
                        <p className="text-[#BFD3C6] text-center py-4">Belum ada data penjualan</p>
                    ) : (
                        <div className="space-y-3">
                            {bestSellers.map((item, i) => (
                                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-[#1A4D35] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="font-numeric text-[#7CFF9B] text-sm w-6">{i + 1}</span>
                                        <p className="text-white text-sm">{item.product_name}</p>
                                    </div>
                                    <span className="font-numeric text-white font-bold">{item.total_sold} terjual</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Favorited Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="h-5 w-5 text-[#D64545]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Produk Paling Difavoritkan</h3>
                    </div>
                    {topProducts.length === 0 ? (
                        <p className="text-[#BFD3C6] text-center py-4">Belum ada produk</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((product, i) => (
                                <div key={product.id} className="flex items-center justify-between py-2 border-b border-[#1A4D35] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="font-numeric text-[#7CFF9B] text-sm w-6">{i + 1}</span>
                                        <div>
                                            <p className="text-white text-sm">{product.name}</p>
                                            <p className="text-[#BFD3C6] text-xs">{product.brand}</p>
                                        </div>
                                    </div>
                                    <span className="font-numeric text-[#D64545] font-bold">♥ {product.favorite_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider">Pesanan Terakhir</h3>
                    <Link href="/dashboard/orders" className="text-[#7CFF9B] text-xs uppercase hover:underline">Lihat Semua</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">ID Pesanan</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pelanggan</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Tanggal</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Total</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[#BFD3C6]">Belum ada pesanan</td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                        <td className="py-4 px-4 font-numeric text-[#7CFF9B]">{order.order_number}</td>
                                        <td className="py-4 px-4 text-white">{order.customer_name}</td>
                                        <td className="py-4 px-4 text-[#BFD3C6]">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="py-4 px-4 font-numeric text-white">Rp {order.total.toLocaleString('id-ID')}</td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-sm ${order.status === 'SELESAI' ? 'bg-[#1E7F43]/30 text-[#7CFF9B] border border-[#1E7F43]' :
                                                order.status === 'DIKIRIM' ? 'bg-cyan-500/20 text-cyan-400' :
                                                    order.status === 'DIKEMAS' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        order.status === 'TELAH_TIBA' ? 'bg-blue-500/20 text-blue-400' :
                                                            order.status === 'DIKONFIRMASI' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-gray-600/20 text-gray-400'
                                                }`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
