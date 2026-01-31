"use client";

import { supabase } from "@/lib/supabase";
import { Search, Filter, RotateCcw, Check, X, Loader2, Eye, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface Return {
    id: string;
    order_id: string;
    customer_id: string;
    reason: string;
    items: any[];
    status: string;
    admin_notes: string | null;
    created_at: string;
    profiles: {
        name: string | null;
        email: string;
    };
    orders: {
        order_number: string;
    };
}

export default function ReturnsPage() {
    const [returns, setReturns] = useState<Return[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('all');

    useEffect(() => {
        fetchReturns();
    }, [getDateRange]);

    const fetchReturns = async () => {
        setIsLoading(true);
        const { startDate, endDate } = getDateRange;

        let query = supabase
            .from('returns')
            .select(`
                *,
                profiles (name, email),
                orders (order_number)
            `)
            .order('created_at', { ascending: false });

        // Apply date filter if not "all"
        if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching returns:', error);
        } else {
            setReturns(data || []);
        }
        setIsLoading(false);
    };

    const handleAction = async (returnId: string, status: string) => {
        if (!confirm(`Apakah Anda yakin ingin ${status === 'APPROVED' ? 'menyetujui' : 'menolak'} pengembalian ini?`)) return;

        setIsProcessing(true);
        const { error } = await supabase
            .from('returns')
            .update({
                status: status,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (error) {
            console.error('Error updating return:', error);
            alert('Gagal memproses pengembalian');
        } else {
            fetchReturns();
            setSelectedReturn(null);
            setAdminNotes("");
        }
        setIsProcessing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-orange-500/20 text-orange-400';
            case 'APPROVED': return 'bg-green-500/20 text-green-400';
            case 'REJECTED': return 'bg-red-500/20 text-red-400';
            case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const filteredReturns = returns.filter(r => {
        const customerName = r.profiles?.name || r.profiles?.email || '';
        const matchesSearch = r.orders?.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filterStatus || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Permintaan Pengembalian</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">{filteredReturns.length} permintaan ditampilkan</p>
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BFD3C6]" />
                        <input
                            type="text"
                            placeholder="Cari Order ID atau Pelanggan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                        />
                    </div>
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#0A1A13] border border-[#1A4D35] text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                >
                    <option value="">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="REJECTED">Ditolak</option>
                    <option value="COMPLETED">Selesai</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] overflow-x-auto rounded-lg">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#1A4D35]">
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">ID Pesanan</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Pelanggan</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Alasan</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Item</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Tanggal</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Status</th>
                            <th className="p-4 text-[#BFD3C6] text-xs uppercase font-bold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A4D35]">
                        {filteredReturns.map((r) => (
                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-white font-medium">{r.orders?.order_number}</td>
                                <td className="p-4 text-white">
                                    <p className="font-medium">{r.profiles?.name || 'Pelanggan'}</p>
                                    <p className="text-xs text-[#BFD3C6]">{r.profiles?.email}</p>
                                </td>
                                <td className="p-4 text-[#BFD3C6] max-w-xs truncate">{r.reason}</td>
                                <td className="p-4 text-white text-sm">{r.items?.length || 0} items</td>
                                <td className="p-4 text-[#BFD3C6] text-sm">
                                    {new Date(r.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${getStatusColor(r.status)}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => setSelectedReturn(r)}
                                        className="p-2 text-[#7CFF9B] hover:bg-[#7CFF9B]/10 rounded transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0A1A13] border border-[#1A4D35] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
                        <div className="sticky top-0 bg-[#0F2A1E] border-b border-[#1A4D35] p-4 flex items-center justify-between">
                            <h2 className="font-heading text-xl text-white uppercase tracking-tight">Detail Return: {selectedReturn.orders?.order_number}</h2>
                            <button onClick={() => setSelectedReturn(null)} className="text-[#BFD3C6] hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Alasan */}
                            <div>
                                <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-2">Alasan Pengembalian</h3>
                                <div className="bg-white/5 border border-white/10 p-4 rounded text-white text-sm italic">
                                    "{selectedReturn.reason}"
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-3">Items untuk Dikembalikan</h3>
                                <div className="space-y-3">
                                    {selectedReturn.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded">
                                            <div className="w-12 h-12 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
                                                <RotateCcw className="h-6 w-6 text-gray-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium">{item.product_name}</p>
                                                <p className="text-xs text-[#BFD3C6]">Qty: {item.quantity} | Size: {item.size || '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#7CFF9B] text-sm font-bold">Rp {(item.unit_price || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Process Section */}
                            {selectedReturn.status === 'PENDING' && (
                                <div className="border-t border-[#1A4D35] pt-6 space-y-4">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold">Proses Permintaan</h3>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Tambahkan catatan admin (opsional)..."
                                        className="w-full bg-[#0F2A1E] border border-[#1A4D35] text-white p-3 text-sm focus:outline-none focus:border-[#7CFF9B] h-24"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => handleAction(selectedReturn.id, 'APPROVED')}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded uppercase text-sm flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            Setujui
                                        </button>
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => handleAction(selectedReturn.id, 'REJECTED')}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded uppercase text-sm flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Completed Status */}
                            {selectedReturn.status !== 'PENDING' && (
                                <div className="border-t border-[#1A4D35] pt-6">
                                    <h3 className="text-[#7CFF9B] text-xs uppercase font-bold mb-2">Status Akhir</h3>
                                    <div className={`inline-block px-3 py-1 rounded text-sm font-bold uppercase mb-4 ${getStatusColor(selectedReturn.status)}`}>
                                        {selectedReturn.status}
                                    </div>
                                    {selectedReturn.admin_notes && (
                                        <div>
                                            <p className="text-[#BFD3C6] text-xs uppercase font-bold mb-1">Catatan Admin:</p>
                                            <p className="text-white text-sm bg-white/5 p-3 rounded">{selectedReturn.admin_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
