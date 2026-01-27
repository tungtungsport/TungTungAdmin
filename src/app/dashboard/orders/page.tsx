"use client";

import { supabase } from "@/lib/supabase";
import { Search, Filter, Truck, Check, Loader2, XCircle, Eye, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

// New 9-status system (Indonesian) - includes MENUNGGU_KONFIRMASI and TELAH_TIBA
type OrderStatus = "BELUM_BAYAR" | "MENUNGGU_KONFIRMASI" | "DIKONFIRMASI" | "DIKEMAS" | "DIKIRIM" | "TELAH_TIBA" | "SELESAI" | "PENGEMBALIAN" | "DIBATALKAN";

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    size?: string;
    product_image?: string;
}

interface PaymentProof {
    id: string;
    image_url: string;
    created_at: string;
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
    payment_method: string | null;
    created_at: string;
    shipped_at: string | null;
    arrived_at: string | null;
    estimated_delivery_hours: number | null;
    profiles: {
        name: string | null;
        email: string;
        phone?: string;
    };
    order_items: OrderItem[];
}

// Status options for dropdown (workflow order) - include DIBATALKAN at the end
const statusOptions: OrderStatus[] = ["BELUM_BAYAR", "MENUNGGU_KONFIRMASI", "DIKONFIRMASI", "DIKEMAS", "DIKIRIM", "TELAH_TIBA", "SELESAI", "DIBATALKAN"];
const allStatusOptions: OrderStatus[] = ["BELUM_BAYAR", "MENUNGGU_KONFIRMASI", "DIKONFIRMASI", "DIKEMAS", "DIKIRIM", "TELAH_TIBA", "SELESAI", "PENGEMBALIAN", "DIBATALKAN"];

// Status labels in Indonesian
const statusLabels: Record<OrderStatus, string> = {
    "BELUM_BAYAR": "Belum Bayar",
    "MENUNGGU_KONFIRMASI": "Menunggu Konfirmasi",
    "DIKONFIRMASI": "Dikonfirmasi",
    "DIKEMAS": "Dikemas",
    "DIKIRIM": "Dikirim",
    "TELAH_TIBA": "Telah Tiba",
    "SELESAI": "Selesai",
    "PENGEMBALIAN": "Pengembalian",
    "DIBATALKAN": "Dibatalkan"
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [editingTracking, setEditingTracking] = useState<string | null>(null);
    const [trackingInput, setTrackingInput] = useState("");

    // Detail modal state
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
    const [loadingProof, setLoadingProof] = useState(false);

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('all');

    useEffect(() => {
        fetchOrders();
    }, [getDateRange]);

    const fetchOrders = async () => {
        setIsLoading(true);
        const { startDate, endDate } = getDateRange;

        let query = supabase
            .from('orders')
            .select(`
                *,
                profiles (name, email, phone),
                order_items (id, product_name, quantity, unit_price, size, product_image)
            `)
            .order('created_at', { ascending: false });

        // Apply date filter if not "all"
        if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setIsLoading(false);
    };

    const fetchPaymentProof = async (orderId: string) => {
        setLoadingProof(true);
        const { data, error } = await supabase
            .from('payment_proofs')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!error && data) {
            setPaymentProof(data);
        } else {
            setPaymentProof(null);
        }
        setLoadingProof(false);
    };

    const openOrderDetail = async (order: Order) => {
        setSelectedOrder(order);
        setPaymentProof(null);
        if (order.payment_method === 'BCA_TRANSFER') {
            await fetchPaymentProof(order.id);
        }
    };

    const closeOrderDetail = () => {
        setSelectedOrder(null);
        setPaymentProof(null);
    };

    const filteredOrders = orders.filter(o => {
        const customerName = o.profiles?.name || o.profiles?.email || '';
        const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filterStatus || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        // Confirm if cancelling
        if (newStatus === 'DIBATALKAN') {
            if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error);
            alert('Gagal mengubah status pesanan');
        } else {
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
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
            BELUM_BAYAR: "bg-orange-500/20 text-orange-400",
            MENUNGGU_KONFIRMASI: "bg-amber-500/20 text-amber-400",
            DIKONFIRMASI: "bg-purple-500/20 text-purple-400",
            DIKEMAS: "bg-yellow-500/20 text-yellow-400",
            DIKIRIM: "bg-cyan-500/20 text-cyan-400",
            TELAH_TIBA: "bg-blue-500/20 text-blue-400",
            SELESAI: "bg-[#1E7F43]/20 text-[#7CFF9B]",
            PENGEMBALIAN: "bg-pink-500/20 text-pink-400",
            DIBATALKAN: "bg-red-500/20 text-red-400"
        };
        return colors[status] || "bg-gray-500/20 text-gray-400";
    };

    const getETA = (createdAt: string, hours: number) => {
        const arrivalDate = new Date(createdAt);
        arrivalDate.setHours(arrivalDate.getHours() + hours);
        return arrivalDate;
    };

    const formatETA = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Status can only be changed if not yet shipped, arrived, completed, cancelled, or returned
    const canChangeStatus = (status: OrderStatus) => {
        return status !== 'DIKIRIM' && status !== 'TELAH_TIBA' && status !== 'SELESAI' && status !== 'DIBATALKAN' && status !== 'PENGEMBALIAN';
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
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Orders</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">{filteredOrders.length} pesanan ditampilkan</p>
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

            {/* Filters */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="h-4 w-4 text-[#BFD3C6]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari pesanan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                    >
                        <option value="">Semua Status</option>
                        {allStatusOptions.map(status => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
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
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pelanggan</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Pembayaran</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Items</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Tanggal</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Total</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-[#BFD3C6]">
                                    Tidak ada pesanan.
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
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${order.payment_method === 'BCA_TRANSFER'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {order.payment_method === 'BCA_TRANSFER' ? 'BCA' : 'COD'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-white text-sm">{order.order_items.length} item</span>
                                    </td>
                                    <td className="py-4 px-4 text-[#BFD3C6] font-numeric">
                                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="py-4 px-4 font-numeric text-white">
                                        Rp {order.total.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-4 px-4">
                                        {/* DIKIRIM: Only allow changing to TELAH_TIBA */}
                                        {order.status === 'DIKIRIM' ? (
                                            <button
                                                onClick={() => updateStatus(order.id, 'TELAH_TIBA')}
                                                className="px-3 py-1.5 text-xs font-bold uppercase bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors rounded"
                                            >
                                                Tandai Telah Tiba
                                            </button>
                                        ) : canChangeStatus(order.status) ? (
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                                                className={`px-3 py-1 text-xs font-bold uppercase border-0 cursor-pointer ${getStatusColor(order.status)}`}
                                            >
                                                {statusOptions.map(status => (
                                                    <option key={status} value={status} className="bg-[#0A1A13] text-white">
                                                        {statusLabels[status]}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 text-xs font-bold uppercase inline-block ${getStatusColor(order.status)}`}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => openOrderDetail(order)}
                                            className="p-2 text-[#7CFF9B] hover:bg-[#7CFF9B]/20 rounded transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-50" onClick={closeOrderDetail} />
                    <div className="fixed inset-4 md:inset-10 lg:inset-20 bg-[#0A1A13] border border-[#1A4D35] z-50 overflow-y-auto rounded-lg">
                        <div className="sticky top-0 bg-[#0F2A1E] border-b border-[#1A4D35] p-4 flex items-center justify-between">
                            <h2 className="font-heading text-xl text-white uppercase">
                                Detail Pesanan: {selectedOrder.order_number}
                            </h2>
                            <button onClick={closeOrderDetail} className="text-[#BFD3C6] hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Customer Info */}
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Informasi Pelanggan</h3>
                                    <p className="text-white font-medium">{selectedOrder.profiles?.name || 'N/A'}</p>
                                    <p className="text-[#BFD3C6] text-sm">{selectedOrder.profiles?.email}</p>
                                    {selectedOrder.profiles?.phone && (
                                        <p className="text-[#BFD3C6] text-sm">{selectedOrder.profiles.phone}</p>
                                    )}
                                </div>

                                {/* Order Status */}
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Status Pesanan</h3>
                                    <span className={`px-3 py-1.5 text-sm font-bold uppercase inline-block rounded ${getStatusColor(selectedOrder.status)}`}>
                                        {statusLabels[selectedOrder.status]}
                                    </span>
                                    <p className="text-[#BFD3C6] text-xs mt-2">
                                        Dibuat: {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                                    </p>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Pembayaran</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${selectedOrder.payment_method === 'BCA_TRANSFER'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {selectedOrder.payment_method === 'BCA_TRANSFER' ? 'BCA Transfer' : 'COD'}
                                    </span>
                                    <p className="text-white font-numeric font-bold text-lg mt-2">
                                        Rp {selectedOrder.total.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shipping_address && (
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Alamat Pengiriman</h3>
                                    <p className="text-white whitespace-pre-wrap">{selectedOrder.shipping_address}</p>
                                </div>
                            )}

                            {/* Tracking Info */}
                            {(selectedOrder.tracking_number || selectedOrder.courier) && (
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Informasi Pengiriman</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedOrder.courier && (
                                            <div>
                                                <p className="text-[#BFD3C6] text-xs">Kurir</p>
                                                <p className="text-white">{selectedOrder.courier}</p>
                                            </div>
                                        )}
                                        {selectedOrder.tracking_number && (
                                            <div>
                                                <p className="text-[#BFD3C6] text-xs">No. Resi</p>
                                                <p className="text-white font-numeric">{selectedOrder.tracking_number}</p>
                                            </div>
                                        )}
                                        {selectedOrder.estimated_delivery_hours && (
                                            <div>
                                                <p className="text-[#BFD3C6] text-xs">Estimasi Tiba</p>
                                                <p className="text-[#7CFF9B] font-bold">
                                                    {formatETA(getETA(selectedOrder.created_at, selectedOrder.estimated_delivery_hours))}
                                                </p>
                                            </div>
                                        )}
                                        {selectedOrder.arrived_at && (
                                            <div className="col-span-2">
                                                <p className="text-[#BFD3C6] text-xs">Tanggal Tiba</p>
                                                <p className="text-white">
                                                    {new Date(selectedOrder.arrived_at).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Proof - For BCA Transfer */}
                            {selectedOrder.payment_method === 'BCA_TRANSFER' && (
                                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Bukti Pembayaran</h3>
                                    {loadingProof ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#7CFF9B]" />
                                        </div>
                                    ) : paymentProof ? (
                                        <div className="space-y-3">
                                            <p className="text-[#BFD3C6] text-xs">
                                                Diupload: {new Date(paymentProof.created_at).toLocaleString('id-ID')}
                                            </p>
                                            <a
                                                href={paymentProof.image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <img
                                                    src={paymentProof.image_url}
                                                    alt="Bukti Pembayaran"
                                                    className="max-w-full max-h-96 rounded border border-[#1A4D35] hover:border-[#7CFF9B] transition-colors cursor-pointer"
                                                />
                                            </a>
                                            <p className="text-[#BFD3C6] text-xs">Klik gambar untuk membuka ukuran penuh</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 py-8 text-[#BFD3C6]">
                                            <ImageIcon className="h-8 w-8 opacity-50" />
                                            <span>Belum ada bukti pembayaran yang diupload</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4 rounded">
                                <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Item Pesanan</h3>
                                <div className="space-y-3">
                                    {selectedOrder.order_items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-[#0A1A13] rounded border border-[#1A4D35]">
                                            <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">IMG</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{item.product_name}</p>
                                                <div className="flex gap-4 text-[#BFD3C6] text-sm">
                                                    <span>Qty: {item.quantity}</span>
                                                    {item.size && <span>Size: {item.size}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#BFD3C6] text-xs">@Rp {item.unit_price.toLocaleString('id-ID')}</p>
                                                <p className="text-white font-numeric font-bold">
                                                    Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {canChangeStatus(selectedOrder.status) && (
                                <div className="flex gap-3">
                                    {selectedOrder.status === 'MENUNGGU_KONFIRMASI' && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder.id, 'DIKONFIRMASI')}
                                            className="px-4 py-2 bg-purple-500 text-white font-bold uppercase text-sm rounded hover:bg-purple-600 transition-colors"
                                        >
                                            <Check className="h-4 w-4 inline mr-2" />
                                            Konfirmasi Pembayaran
                                        </button>
                                    )}
                                    <button
                                        onClick={() => updateStatus(selectedOrder.id, 'DIBATALKAN')}
                                        className="px-4 py-2 bg-red-500/20 text-red-400 font-bold uppercase text-sm rounded hover:bg-red-500/30 transition-colors"
                                    >
                                        <XCircle className="h-4 w-4 inline mr-2" />
                                        Batalkan Pesanan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
