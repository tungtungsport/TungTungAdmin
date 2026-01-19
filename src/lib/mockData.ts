// Mock Admin User
export const adminUser = {
    id: "ADM-001",
    username: "admin_tungtung",
    name: "Admin Tung Tung Sport",
    email: "admin@tungtungsport.com",
    role: "ADMIN"
};

// Mock Products
export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    stock: number;
    status: "active" | "inactive" | "low_stock";
    image: string;
    favoriteCount: number;
}

export const products: Product[] = [
    { id: "PRD-001", name: "Phantom GX Elite FG", brand: "Nike", category: "Futsal", price: 3500000, stock: 24, status: "active", image: "/products/phantom.png", favoriteCount: 47 },
    { id: "PRD-002", name: "Predator Accuracy.1", brand: "Adidas", category: "Futsal", price: 3200000, stock: 18, status: "active", image: "/products/predator.png", favoriteCount: 38 },
    { id: "PRD-003", name: "Ultra Ultimate FG/AG", brand: "Puma", category: "Football", price: 2800000, stock: 3, status: "low_stock", image: "/products/ultra.png", favoriteCount: 31 },
    { id: "PRD-004", name: "Lightspeed Reborn", brand: "Specs", category: "Futsal", price: 599000, stock: 45, status: "active", image: "/products/lightspeed.png", favoriteCount: 24 },
    { id: "PRD-005", name: "Mercurial Vapor 15", brand: "Nike", category: "Football", price: 1800000, stock: 0, status: "inactive", image: "/products/vapor.png", favoriteCount: 52 },
    { id: "PRD-006", name: "Copa Pure.3 TF", brand: "Adidas", category: "Futsal", price: 900000, stock: 30, status: "active", image: "/products/copa.png", favoriteCount: 19 },
    { id: "PRD-007", name: "Top Sala Competition", brand: "Adidas", category: "Futsal", price: 1200000, stock: 2, status: "low_stock", image: "/products/topsala.png", favoriteCount: 15 },
    { id: "PRD-008", name: "React Gato", brand: "Nike", category: "Futsal", price: 1950000, stock: 22, status: "active", image: "/products/gato.png", favoriteCount: 28 },
    { id: "PRD-009", name: "Future Ultimate", brand: "Puma", category: "Football", price: 3100000, stock: 12, status: "active", image: "/products/future.png", favoriteCount: 33 },
    { id: "PRD-010", name: "Barricada Ultima", brand: "Specs", category: "Futsal", price: 450000, stock: 60, status: "active", image: "/products/barricada.png", favoriteCount: 11 },
    { id: "PRD-011", name: "X Crazyfast.1", brand: "Adidas", category: "Football", price: 2900000, stock: 1, status: "low_stock", image: "/products/crazyfast.png", favoriteCount: 42 },
    { id: "PRD-012", name: "Tiempo Legend 10", brand: "Nike", category: "Football", price: 2500000, stock: 15, status: "active", image: "/products/tiempo.png", favoriteCount: 36 },
];

// Mock Orders
export type OrderStatus = "NEW" | "PAID" | "PROCESSING" | "SHIPPED" | "COMPLETED";

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    total: number;
    status: OrderStatus;
    courier: string;
    trackingNumber: string;
    items: { productId: string; productName: string; quantity: number; price: number }[];
}

export const orders: Order[] = [
    { id: "ORD-2026-001", customerId: "CST-001", customerName: "Andi Pratama", date: "2026-01-18", total: 3500000, status: "PROCESSING", courier: "JNE", trackingNumber: "", items: [{ productId: "PRD-001", productName: "Phantom GX Elite FG", quantity: 1, price: 3500000 }] },
    { id: "ORD-2026-002", customerId: "CST-002", customerName: "Budi Santoso", date: "2026-01-18", total: 2800000, status: "NEW", courier: "", trackingNumber: "", items: [{ productId: "PRD-003", productName: "Ultra Ultimate FG/AG", quantity: 1, price: 2800000 }] },
    { id: "ORD-2026-003", customerId: "CST-003", customerName: "Citra Dewi", date: "2026-01-17", total: 4100000, status: "PAID", courier: "", trackingNumber: "", items: [{ productId: "PRD-002", productName: "Predator Accuracy.1", quantity: 1, price: 3200000 }, { productId: "PRD-006", productName: "Copa Pure.3 TF", quantity: 1, price: 900000 }] },
    { id: "ORD-2026-004", customerId: "CST-004", customerName: "Dimas Wijaya", date: "2026-01-17", total: 1950000, status: "SHIPPED", courier: "SiCepat", trackingNumber: "SCP2026011700123", items: [{ productId: "PRD-008", productName: "React Gato", quantity: 1, price: 1950000 }] },
    { id: "ORD-2026-005", customerId: "CST-005", customerName: "Eka Putri", date: "2026-01-16", total: 599000, status: "COMPLETED", courier: "JNT", trackingNumber: "JNT2026011600045", items: [{ productId: "PRD-004", productName: "Lightspeed Reborn", quantity: 1, price: 599000 }] },
    { id: "ORD-2026-006", customerId: "CST-001", customerName: "Andi Pratama", date: "2026-01-16", total: 3100000, status: "COMPLETED", courier: "JNE", trackingNumber: "JNE2026011600089", items: [{ productId: "PRD-009", productName: "Future Ultimate", quantity: 1, price: 3100000 }] },
    { id: "ORD-2026-007", customerId: "CST-006", customerName: "Faisal Rahman", date: "2026-01-15", total: 2500000, status: "COMPLETED", courier: "AnterAja", trackingNumber: "AJ20260115123", items: [{ productId: "PRD-012", productName: "Tiempo Legend 10", quantity: 1, price: 2500000 }] },
    { id: "ORD-2026-008", customerId: "CST-007", customerName: "Gita Sari", date: "2026-01-15", total: 900000, status: "SHIPPED", courier: "JNE", trackingNumber: "JNE2026011500234", items: [{ productId: "PRD-006", productName: "Copa Pure.3 TF", quantity: 1, price: 900000 }] },
];

// Mock Customers
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalOrders: number;
    lastOrderDate: string;
    status: "active" | "inactive";
}

export const customers: Customer[] = [
    { id: "CST-001", name: "Andi Pratama", email: "andi@email.com", phone: "+62 812 3456 7890", totalOrders: 5, lastOrderDate: "2026-01-18", status: "active" },
    { id: "CST-002", name: "Budi Santoso", email: "budi@email.com", phone: "+62 813 4567 8901", totalOrders: 2, lastOrderDate: "2026-01-18", status: "active" },
    { id: "CST-003", name: "Citra Dewi", email: "citra@email.com", phone: "+62 814 5678 9012", totalOrders: 3, lastOrderDate: "2026-01-17", status: "active" },
    { id: "CST-004", name: "Dimas Wijaya", email: "dimas@email.com", phone: "+62 815 6789 0123", totalOrders: 1, lastOrderDate: "2026-01-17", status: "active" },
    { id: "CST-005", name: "Eka Putri", email: "eka@email.com", phone: "+62 816 7890 1234", totalOrders: 4, lastOrderDate: "2026-01-16", status: "active" },
    { id: "CST-006", name: "Faisal Rahman", email: "faisal@email.com", phone: "+62 817 8901 2345", totalOrders: 2, lastOrderDate: "2026-01-15", status: "active" },
    { id: "CST-007", name: "Gita Sari", email: "gita@email.com", phone: "+62 818 9012 3456", totalOrders: 1, lastOrderDate: "2026-01-15", status: "active" },
    { id: "CST-008", name: "Hendra Gunawan", email: "hendra@email.com", phone: "+62 819 0123 4567", totalOrders: 0, lastOrderDate: "-", status: "inactive" },
];

// Dashboard Stats
export const dashboardStats = {
    totalSales: 125400000,
    ordersToday: 28,
    lowStockProducts: 4,
    totalFavorites: 137,
    salesTrend: 12,
};

// Sales Chart Data (Last 7 days)
export const salesChartData = [
    { day: "Mon", sales: 15200000 },
    { day: "Tue", sales: 18500000 },
    { day: "Wed", sales: 12800000 },
    { day: "Thu", sales: 22100000 },
    { day: "Fri", sales: 19450000 },
    { day: "Sat", sales: 25800000 },
    { day: "Sun", sales: 11550000 },
];

// Top Favorited Products
export const topFavoritedProducts = products
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, 5);
