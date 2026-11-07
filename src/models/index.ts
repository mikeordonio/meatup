import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  defaultAddress: string;
  createdAt?: Timestamp;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  isOpen: boolean;
  isApproved: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Timestamp;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  category: 'Pork' | 'Chicken';
  description: string;
  pricePerKg: number;
  stockKg: number;
  minStockKg: number;
  imageUrl: string;
  isAvailable: boolean;
  imageData?: string;
  createdAt?: Timestamp;
}

export interface CartItem {
  product: Product;
  quantityKg: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface OrderItem {
  productId: string;
  productName: string;
  pricePerKg: number;
  quantityKg: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentMethod: 'pickup' | 'delivery';
  deliveryAddress: string;
  status: OrderStatus;
  createdAt?: Timestamp;
}

export interface ReportSummary {
  revenue: number;
  orders: number;
  customers: number;
  shops: number;
  products: number;
}
