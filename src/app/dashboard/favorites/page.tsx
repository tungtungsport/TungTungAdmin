"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, TrendingUp, Package, Search, Loader2, User, X, ArrowUpDown } from "lucide-react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface FavoriteProduct {
    id: string;
    name: string;
    brand: string;
    favorite_count: number;
    stock: number;
    status: string;
}

interface FavoriteDetail {
    user_id: string;
    user_name: string;
    user_email: string;
    created_at: string;
}

export default function FavoritesPage() {
    const [products, setProducts] = useState<FavoriteProduct[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<FavoriteProduct | null>(null);
    const [favoriteDetails, setFavoriteDetails] = useState<FavoriteDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sortAsc, setSortAsc] = useState(false); // false = desc (newest first)

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('all');

    useEffect(() => {
        fetchFavorites();
    }, [getDateRange]);

    const fetchFavorites = async () => {
        setIsLoading(true);
        const { startDate, endDate } = getDateRange;

        // If filtering by date, we need to count favorites within that date range
        if (startDate && endDate) {
            // Get favorites within date range and aggregate by product
            const { data: favoritesData, error: favError } = await supabase
                .from('favorites')
                .select('product_id')
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (favError) {
                console.error('Error fetching favorites:', favError);
                setIsLoading(false);
                return;
            }

            // Count favorites per product
            const productCounts: Record<string, number> = {};
            (favoritesData || []).forEach((fav: any) => {
                productCounts[fav.product_id] = (productCounts[fav.product_id] || 0) + 1;
            });

            // Get product details for products that have favorites
            const productIds = Object.keys(productCounts);
            if (productIds.length === 0) {
                setProducts([]);
                setIsLoading(false);
                return;
            }

            const { data: productsData, error: prodError } = await supabase
                .from('products')
                .select('id, name, brand, stock, status')
                .in('id', productIds);

            if (prodError) {
                console.error('Error fetching products:', prodError);
                setIsLoading(false);
                return;
            }

            // Combine data
            const productsWithCounts = (productsData || []).map(p => ({
                ...p,
                favorite_count: productCounts[p.id] || 0
            })).sort((a, b) => b.favorite_count - a.favorite_count);

            setProducts(productsWithCounts);
        } else {
            // No date filter - get all products with their favorite_count
            const { data, error } = await supabase
                .from('products')
                .select('id, name, brand, favorite_count, stock, status')
                .order('favorite_count', { ascending: false });

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data || []);
            }
        }
        setIsLoading(false);
    };

    const openFavoriteModal = async (product: FavoriteProduct) => {
        setSelectedProduct(product);
        setModalOpen(true);
        setLoadingDetails(true);
        setFavoriteDetails([]);

        const { startDate, endDate } = getDateRange;

        // Fetch favorites with user details
        let query = supabase
            .from('favorites')
            .select(`
                user_id,
                created_at,
                profiles!inner(name, email)
            `)
            .eq('product_id', product.id);

        if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching favorite details:', error);
        } else {
            const details: FavoriteDetail[] = (data || []).map((fav: any) => ({
                user_id: fav.user_id,
                user_name: fav.profiles?.name || 'Unknown',
                user_email: fav.profiles?.email || '',
                created_at: fav.created_at
            }));

            setFavoriteDetails(details);
        }

        setLoadingDetails(false);
    };

    const toggleSort = () => {
        setSortAsc(!sortAsc);
        setFavoriteDetails([...favoriteDetails].reverse());
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalFavorites = products.reduce((sum, p) => sum + p.favorite_count, 0);
    const avgFavorites = products.length > 0 ? Math.round(totalFavorites / products.length) : 0;
    const topProduct = products[0];

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
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Analitik Favorit</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">Lacak perilaku wishlist pelanggan</p>
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

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0A1A13] text-[#D64545]">
                            <Heart className="h-6 w-6 fill-current" />
                        </div>
                        <div>
                            <p className="text-[#BFD3C6] text-xs uppercase">Total Favorit</p>
                            <p className="font-numeric text-2xl text-white font-bold">{totalFavorites}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0A1A13] text-[#7CFF9B]">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[#BFD3C6] text-xs uppercase">Rata-rata per Produk</p>
                            <p className="font-numeric text-2xl text-white font-bold">{avgFavorites}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0A1A13] text-[#F2E94E]">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[#BFD3C6] text-xs uppercase">Paling Difavoritkan</p>
                            <p className="text-white font-bold truncate max-w-[150px]">{topProduct?.name || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-4">
                <div className="relative max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="h-4 w-4 text-[#BFD3C6]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                    />
                </div>
            </div>

            {/* Favorites Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A4D35]">
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">#</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Produk</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Merek</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Jumlah Difavoritkan</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Stok Saat Ini</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-[#BFD3C6]">
                                    Tidak ada favorit ditemukan untuk periode ini.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => (
                                <tr key={product.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                    <td className="py-4 px-4 font-numeric text-[#7CFF9B]">{index + 1}</td>
                                    <td className="py-4 px-4">
                                        <div>
                                            <p className="text-white font-medium">{product.name}</p>
                                            <p className="text-[#BFD3C6] text-xs">{product.id.slice(0, 8)}...</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-white">{product.brand}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-[#D64545] fill-current" />
                                            <span className="font-numeric text-white font-bold">{product.favorite_count}</span>
                                        </div>
                                    </td>
                                    <td className={`py-4 px-4 font-numeric ${product.stock <= 5 ? "text-[#F2E94E]" : "text-white"}`}>
                                        {product.stock}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${product.status === 'active' ? 'bg-[#1E7F43]/20 text-[#7CFF9B]' :
                                            product.status === 'low_stock' ? 'bg-[#F2E94E]/20 text-[#F2E94E]' :
                                                'bg-gray-600/20 text-gray-400'
                                            }`}>
                                            {product.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => openFavoriteModal(product)}
                                            className="px-3 py-1.5 bg-[#1E7F43]/20 hover:bg-[#1E7F43]/30 text-[#7CFF9B] text-xs font-bold uppercase border border-[#7CFF9B]/30 transition-colors"
                                        >
                                            Lihat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalOpen(false)}>
                    <div className="bg-[#0F2A1E] border-2 border-[#1A4D35] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#1A4D35]">
                            <div>
                                <h3 className="text-xl font-heading text-white uppercase tracking-wider">Detail Favorit</h3>
                                <p className="text-sm text-[#BFD3C6] mt-1">{selectedProduct?.name}</p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 hover:bg-[#1A4D35]/50 transition-colors"
                            >
                                <X className="h-5 w-5 text-[#BFD3C6]" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
                                </div>
                            ) : favoriteDetails.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm text-[#BFD3C6]">
                                            <span className="font-bold text-[#7CFF9B]">{favoriteDetails.length}</span> pengguna menyukai produk ini
                                        </p>
                                        <button
                                            onClick={toggleSort}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E7F43]/20 hover:bg-[#1E7F43]/30 text-[#7CFF9B] text-xs font-bold uppercase border border-[#7CFF9B]/30 transition-colors"
                                        >
                                            <ArrowUpDown className="h-3 w-3" />
                                            {sortAsc ? 'Terlama' : 'Terbaru'}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {favoriteDetails.map((detail, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-[#0A1A13] border border-[#1A4D35] p-4 hover:bg-[#1A4D35]/20 transition-colors">
                                                <div className="p-3 bg-[#1E7F43]/20 text-[#7CFF9B] flex-shrink-0">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium">{detail.user_name}</p>
                                                    <p className="text-[#BFD3C6] text-sm truncate">{detail.user_email}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[#7CFF9B] text-sm font-medium">
                                                        {new Date(detail.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-[#BFD3C6] text-xs">
                                                        {new Date(detail.created_at).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <Heart className="h-12 w-12 text-[#BFD3C6]/30 mx-auto mb-4" />
                                    <p className="text-[#BFD3C6]">Tidak ada data favorit untuk periode ini</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
