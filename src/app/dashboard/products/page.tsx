"use client";

import { supabase } from "@/lib/supabase";
import { Search, Plus, Edit, Trash2, Filter, X, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    stock: number;
    status: "active" | "inactive" | "low_stock";
    images: string[];
    favorite_count: number;
}

interface ProductFormData {
    name: string;
    brand: string;
    category: string;
    price: number;
    stock: number;
    status: "active" | "inactive" | "low_stock";
    images: string[];
}

const emptyFormData: ProductFormData = {
    name: "",
    brand: "",
    category: "Futsal",
    price: 0,
    stock: 0,
    status: "active",
    images: []
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
    const [imageUrls, setImageUrls] = useState("");
    const [videoUrl, setVideoUrl] = useState("");

    // Delete confirmation
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Fetch products from Supabase
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            setProducts(data || []);
        }
        setIsLoading(false);
    };

    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.brand.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBrand = !filterBrand || p.brand === filterBrand;
            return matchesSearch && matchesBrand;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "price-asc":
                    return a.price - b.price;
                case "price-desc":
                    return b.price - a.price;
                case "stock-asc":
                    return a.stock - b.stock;
                case "stock-desc":
                    return b.stock - a.stock;
                case "newest":
                default:
                    // Assuming ID or createdAt if available, but for now we'll use the original order or ID
                    return 0; // The fetch already orders by created_at desc
            }
        });

    const brands = [...new Set(products.map(p => p.brand))];
    const categories = ["Futsal", "Football"];

    const getStatusBadge = (status: string) => {
        const classes = {
            active: "bg-[#1E7F43]/20 text-[#7CFF9B]",
            inactive: "bg-gray-600/20 text-gray-400",
            low_stock: "bg-[#F2E94E]/20 text-[#F2E94E]"
        };
        return classes[status as keyof typeof classes] || classes.inactive;
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(emptyFormData);
        setImageUrls("");
        setVideoUrl("");
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
            stock: product.stock,
            status: product.status,
            images: product.images || []
        });
        setImageUrls(Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (typeof product.images === 'string' ? product.images : ""));
        setVideoUrl((product as any).video_url || "");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(emptyFormData);
        setImageUrls("");
        setVideoUrl("");
    };

    const handleFormChange = (field: keyof ProductFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.brand) return;
        setIsSaving(true);

        // Parse image URL (Single image support to handle Base64 properly)
        const trimUrl = imageUrls.trim();
        const images = trimUrl ? [trimUrl] : [];

        const productData = {
            name: formData.name,
            brand: formData.brand,
            category: formData.category,
            price: formData.price,
            stock: formData.stock,
            status: formData.status,
            images: images,
            video_url: videoUrl || null
        };

        if (editingProduct) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingProduct.id);

            if (error) {
                console.error('Error updating product:', error);
            }
        } else {
            // Create new product
            const { error } = await supabase
                .from('products')
                .insert(productData);

            if (error) {
                console.error('Error creating product:', error);
            }
        }

        setIsSaving(false);
        closeModal();
        fetchProducts();
    };

    const handleDelete = async (productId: string) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Error deleting product:', error);
        } else {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
        setDeleteConfirmId(null);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Products</h1>
                    <p className="text-[#BFD3C6] text-sm mt-1">{products.length} products in inventory</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#1E7F43] hover:bg-[#1E7F43]/80 text-white px-4 py-2 font-bold uppercase text-sm transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Product
                </button>
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
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/50"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Filter className="h-4 w-4 text-[#BFD3C6]" />
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            className="bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                        >
                            <option value="">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[#BFD3C6] text-sm uppercase font-bold tracking-wider">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7CFF9B]"
                        >
                            <option value="newest">Newest</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                            <option value="stock-asc">Stock (Low to High)</option>
                            <option value="stock-desc">Stock (High to Low)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A4D35]">
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Product</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Brand</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Category</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Price</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Stock</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Status</th>
                            <th className="text-left py-4 px-4 text-[#BFD3C6] text-xs uppercase font-bold tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-[#BFD3C6]">
                                    No products found. Click "Add Product" to create one.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#0A1A13] flex items-center justify-center text-[#7CFF9B] text-xs font-bold flex-shrink-0 overflow-hidden border border-[#1A4D35]">
                                                {(() => {
                                                    const productImages = Array.isArray(product.images)
                                                        ? product.images
                                                        : (typeof product.images === 'string' ? [product.images] : []);
                                                    const displayImage = productImages.filter(img => img && img.length > 0)[0];

                                                    return displayImage ? (
                                                        <img
                                                            src={displayImage}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span>${product.brand.charAt(0)}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>{product.brand.charAt(0)}</span>
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{product.name}</p>
                                                <p className="text-[#BFD3C6] text-xs">{product.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-white">{product.brand}</td>
                                    <td className="py-4 px-4 text-[#BFD3C6]">{product.category}</td>
                                    <td className="py-4 px-4 font-numeric text-white">Rp {product.price.toLocaleString('id-ID')}</td>
                                    <td className={`py-4 px-4 font-numeric ${product.stock <= 5 ? "text-[#F2E94E]" : "text-white"}`}>
                                        {product.stock}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${getStatusBadge(product.status)}`}>
                                            {product.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        {deleteConfirmId === product.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#D64545] text-xs">Delete?</span>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="px-2 py-1 bg-[#D64545] text-white text-xs font-bold"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="px-2 py-1 bg-gray-600 text-white text-xs font-bold"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-1.5 text-[#BFD3C6] hover:text-[#7CFF9B] transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(product.id)}
                                                    className="p-1.5 text-[#BFD3C6] hover:text-[#D64545] transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0F2A1E] border border-[#1A4D35] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#1A4D35]">
                            <h2 className="font-heading text-lg text-white uppercase">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={closeModal} className="text-[#BFD3C6] hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                    placeholder="e.g. Phantom GX Elite FG"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Brand *</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => handleFormChange('brand', e.target.value)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                        placeholder="e.g. Nike"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleFormChange('category', e.target.value)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Price (Rp)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleFormChange('price', parseInt(e.target.value) || 0)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => handleFormChange('stock', parseInt(e.target.value) || 0)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#BFD3C6] text-xs uppercase mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B]"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="low_stock">Low Stock</option>
                                </select>
                            </div>

                            {/* Media Section */}
                            <div className="border-t border-[#1A4D35] pt-4 mt-4">
                                <label className="block text-[#BFD3C6] text-xs uppercase mb-3">Product Media</label>
                                <div className="mb-4">
                                    <label className="block text-[#BFD3C6] text-xs mb-1">Image URL (HTTP link or Base64)</label>
                                    <input
                                        type="text"
                                        value={imageUrls}
                                        onChange={(e) => setImageUrls(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#BFD3C6] text-xs mb-1">Video URL (optional)</label>
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7CFF9B] placeholder:text-[#BFD3C6]/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1A4D35]">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-[#BFD3C6] hover:text-white text-sm uppercase font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-[#1E7F43] hover:bg-[#1E7F43]/80 text-white px-4 py-2 font-bold uppercase text-sm transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {editingProduct ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
