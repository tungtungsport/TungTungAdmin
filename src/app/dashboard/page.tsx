"use client";

import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, Heart, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DashboardStats {
    totalSales: number;
    ordersToday: number;
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
        ordersToday: 0,
        lowStockProducts: 0,
        totalFavorites: 0
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
    const [dailySales, setDailySales] = useState<DailySales[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);

            // Fetch total sales (sum of completed orders)
            const { data: salesData } = await supabase
                .from('orders')
                .select('total')
                .eq('status', 'SELESAI');
            const totalSales = salesData?.reduce((sum, o) => sum + o.total, 0) || 0;

            // Fetch orders today
            const today = new Date().toISOString().split('T')[0];
            const { count: ordersToday } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', `${today}T00:00:00`);

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
                ordersToday: ordersToday || 0,
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

            // Fetch best sellers from order_items
            const { data: orderItemsData } = await supabase
                .from('order_items')
                .select('product_id, product_name, quantity');

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

            // Fetch daily sales for the last 7 days
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const salesByDay: DailySales[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayStr = date.toISOString().split('T')[0];
                const { data: daySalesData } = await supabase
                    .from('orders')
                    .select('total')
                    .gte('created_at', `${dayStr}T00:00:00`)
                    .lt('created_at', `${dayStr}T23:59:59`);
                const daySales = daySalesData?.reduce((sum, o) => sum + o.total, 0) || 0;
                salesByDay.push({ day: days[date.getDay()], sales: daySales });
            }
            setDailySales(salesByDay);

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
    }, []);

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
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Dashboard & Reports</h1>
                <p className="text-[#BFD3C6] text-sm mt-1">Welcome back, Admin. Here&apos;s your store summary and analytics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sales"
                    value={`Rp ${(stats.totalSales / 1000000).toFixed(1)}M`}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Orders Today"
                    value={stats.ordersToday}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Low Stock Alert"
                    value={stats.lowStockProducts}
                    icon={AlertTriangle}
                    color="warning"
                />
                <StatCard
                    title="Total Favorites"
                    value={stats.totalFavorites}
                    icon={Heart}
                />
            </div>

            {/* Sales Chart */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-[#7CFF9B]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Sales Over Time (Last 7 Days)</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[#BFD3C6] text-xs">Weekly Total</p>
                        <p className="font-numeric text-[#7CFF9B] font-bold">Rp {(totalWeekSales / 1000000).toFixed(1)}M</p>
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
                                        Rp {(data.sales / 1000000).toFixed(1)}M
                                    </div>
                                </div>
                            </div>
                            <span className="text-[#BFD3C6] text-xs font-bold">{data.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Selling Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ShoppingCart className="h-5 w-5 text-[#7CFF9B]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Best Selling Products</h3>
                    </div>
                    {bestSellers.length === 0 ? (
                        <p className="text-[#BFD3C6] text-center py-4">No sales data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {bestSellers.map((item, i) => (
                                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-[#1A4D35] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="font-numeric text-[#7CFF9B] text-sm w-6">{i + 1}</span>
                                        <p className="text-white text-sm">{item.product_name}</p>
                                    </div>
                                    <span className="font-numeric text-white font-bold">{item.total_sold} sold</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Favorited Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="h-5 w-5 text-[#D64545]" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider">Most Favorited Products</h3>
                    </div>
                    {topProducts.length === 0 ? (
                        <p className="text-[#BFD3C6] text-center py-4">No products yet</p>
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
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider">Recent Orders</h3>
                    <Link href="/dashboard/orders" className="text-[#7CFF9B] text-xs uppercase hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Order ID</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Customer</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Date</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Total</th>
                                <th className="text-left py-3 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[#BFD3C6]">No orders yet</td>
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
