"use client";

import { products } from "@/lib/mockData";
import { Heart, TrendingUp, Package, Search } from "lucide-react";
import { useState } from "react";

export default function FavoritesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Sort products by favorite count
    const sortedProducts = [...products].sort((a, b) => b.favoriteCount - a.favoriteCount);

    const filteredProducts = sortedProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalFavorites = products.reduce((sum, p) => sum + p.favoriteCount, 0);
    const avgFavorites = Math.round(totalFavorites / products.length);
    const topProduct = sortedProducts[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Favorites Analytics</h1>
                <p className="text-[#BFD3C6] text-sm mt-1">Track customer wishlist behavior</p>
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
                            <p className="text-white font-bold truncate max-w-[150px]">{topProduct?.name}</p>
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
                        {filteredProducts.map((product, index) => (
                            <tr key={product.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                <td className="py-4 px-4 font-numeric text-[#7CFF9B]">{index + 1}</td>
                                <td className="py-4 px-4">
                                    <div>
                                        <p className="text-white font-medium">{product.name}</p>
                                        <p className="text-[#BFD3C6] text-xs">{product.id}</p>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-white">{product.brand}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-[#D64545] fill-current" />
                                        <span className="font-numeric text-white font-bold">{product.favoriteCount}</span>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
