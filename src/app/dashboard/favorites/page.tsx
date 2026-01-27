"use client";

import { supabase } from "@/lib/supabase";
import { Heart, TrendingUp, Package, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface FavoriteProduct {
    id: string;
    name: string;
    brand: string;
    favorite_count: number;
    stock: number;
    status: string;
}

export default function FavoritesPage() {
    const [products, setProducts] = useState<FavoriteProduct[]>([]);
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
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Favorites Analytics</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">Track customer wishlist behavior</p>
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
                            <p className="text-[#BFD3C6] text-xs uppercase">Total Favorites</p>
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
                            <p className="text-[#BFD3C6] text-xs uppercase">Avg per Product</p>
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
                            <p className="text-[#BFD3C6] text-xs uppercase">Most Favorited</p>
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
                        placeholder="Search products..."
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
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Product</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Brand</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Times Favorited</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Current Stock</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-[#BFD3C6]">
                                    No favorites found for this period.
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
