"use client";

import { supabase } from "@/lib/supabase";
import { Search, Filter, Truck, Check, Loader2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

type OrderStatus = "NEW" | "PAID" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    size?: string;
}

interface Order {
    id: string;
    order_number: string;
    customer_id: string;
    status: OrderStatus;
    total: number;
    courier: string | null;
    tracking_number: string | null;
    shipping_address: string | null;
    created_at: string;
    profiles: {
        name: string | null;
        email: string;
    };
    order_items: OrderItem[];
}

const statusOptions: OrderStatus[] = ["NEW", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"];
const allStatusOptions: OrderStatus[] = ["NEW", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [editingTracking, setEditingTracking] = useState<string | null>(null);
    const [trackingInput, setTrackingInput] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles (name, email),
                order_items (id, product_name, quantity, unit_price, size)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setIsLoading(false);
    };

    const filteredOrders = orders.filter(o => {
        const customerName = o.profiles?.name || o.profiles?.email || '';
        const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filterStatus || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error);
        } else {
            fetchOrders();
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'CANCELLED' })
            .eq('id', orderId);

        if (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        } else {
            fetchOrders();
        }
    };

    const saveTracking = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ tracking_number: trackingInput })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating tracking:', error);
        } else {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, tracking_number: trackingInput } : o
            ));
        }
        setEditingTracking(null);
        setTrackingInput("");
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            NEW: "bg-blue-500/20 text-blue-400",
            PAID: "bg-purple-500/20 text-purple-400",
            PROCESSING: "bg-yellow-500/20 text-yellow-400",
            SHIPPED: "bg-cyan-500/20 text-cyan-400",
            COMPLETED: "bg-[#1E7F43]/20 text-[#7CFF9B]",
            CANCELLED: "bg-red-500/20 text-red-400"
        };
        return colors[status] || "bg-gray-500/20 text-gray-400";
    };

    const canChangeStatus = (status: OrderStatus) => {
        return status !== 'COMPLETED' && status !== 'CANCELLED';
    };

    const canCancel = (status: OrderStatus) => {
        return status !== 'SHIPPED' && status !== 'COMPLETED' && status !== 'CANCELLED';
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
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Orders</h1>
                <p className="text-[#BFD3C6] text-sm mt-1">{orders.length} total orders</p>
            </div>

            {/* Filters */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="h-4 w-4 text-[#BFD3C6]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-[#BFD3C6]" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                    >
                        <option value="">All Status</option>
                        {allStatusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A4D35]">
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Order ID</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Customer</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Items</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Date</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Total</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Tracking</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-[#BFD3C6]">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                    <td className="py-4 px-4">
                                        <span className="text-white font-medium">{order.order_number}</span>
                                    </td>
                                    <td className="py-4 px-4 text-white">
                                        {order.profiles?.name || order.profiles?.email || 'Unknown'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="space-y-1 max-w-xs">
                                            {order.order_items.slice(0, 2).map((item, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <span className="text-white">{item.product_name}</span>
                                                    <span className="text-[#BFD3C6] text-xs ml-2">
                                                        x{item.quantity}
                                                        {item.size && ` • Size ${item.size}`}
                                                    </span>
                                                </div>
                                            ))}
                                            {order.order_items.length > 2 && (
                                                <span className="text-[#BFD3C6] text-xs italic">
                                                    +{order.order_items.length - 2} more items
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-[#BFD3C6] font-numeric">
                                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="py-4 px-4 font-numeric text-white">
                                        Rp {order.total.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1">
                                            {canChangeStatus(order.status) ? (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                                                    className={`px-3 py-1 text-xs font-bold uppercase border-0 cursor-pointer ${getStatusColor(order.status)}`}
                                                >
                                                    {statusOptions.map(status => (
                                                        <option key={status} value={status} className="bg-[#0A1A13] text-white">{status}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`px-3 py-1 text-xs font-bold uppercase inline-block ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            )}
                                            {canCancel(order.status) && (
                                                <button
                                                    onClick={() => cancelOrder(order.id)}
                                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                                                >
                                                    <XCircle className="h-3 w-3" /> Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {editingTracking === order.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={trackingInput}
                                                    onChange={(e) => setTrackingInput(e.target.value)}
                                                    className="bg-[#0A1A13] border border-[#1A4D35] text-white px-2 py-1 text-xs w-32"
                                                    placeholder="Tracking #"
                                                />
                                                <button
                                                    onClick={() => saveTracking(order.id)}
                                                    className="p-1 text-[#7CFF9B] hover:bg-[#7CFF9B]/20"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#BFD3C6] text-sm font-numeric">
                                                    {order.tracking_number || '-'}
                                                </span>
                                                {order.status === 'SHIPPED' && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingTracking(order.id);
                                                            setTrackingInput(order.tracking_number || '');
                                                        }}
                                                        className="p-1 text-[#BFD3C6] hover:text-[#7CFF9B]"
                                                    >
                                                        <Truck className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
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
