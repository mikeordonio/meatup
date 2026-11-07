import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase';
import type { AdminAnalytics, OrderStatus, OwnerSummary, Product, ReportSummary, Shop, UserProfile } from '@/models';

export async function listOwnerShops(ownerId: string): Promise<Shop[]> {
  const snapshot = await getDocs(query(collection(db, 'shops'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Shop);
}

export async function saveShop(input: Omit<Shop, 'id' | 'createdAt'>, id?: string): Promise<string> {
  if (id) {
    await updateDoc(doc(db, 'shops', id), input);
    return id;
  }
  const entry = await addDoc(collection(db, 'shops'), { ...input, createdAt: serverTimestamp() });
  return entry.id;
}

export async function listOwnerProducts(ownerId: string): Promise<Product[]> {
  const shops = await listOwnerShops(ownerId);
  if (!shops.length) return [];
  const products = await Promise.all(
    shops.map(async (shop) => {
      const snapshot = await getDocs(query(collection(db, 'products'), where('shopId', '==', shop.id)));
      return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Product);
    }),
  );
  return products.flat().sort((left, right) => left.name.localeCompare(right.name));
}

export async function saveProduct(input: Omit<Product, 'id' | 'createdAt'>, id?: string): Promise<string> {
  if (id) {
    await updateDoc(doc(db, 'products', id), input);
    return id;
  }
  const entry = await addDoc(collection(db, 'products'), { ...input, createdAt: serverTimestamp() });
  return entry.id;
}

export async function removeProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

export async function listUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500)));
  return snapshot.docs.map((entry) => entry.data() as UserProfile);
}

export async function listAllShops(): Promise<Shop[]> {
  const snapshot = await getDocs(query(collection(db, 'shops'), orderBy('createdAt', 'desc'), limit(500)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Shop);
}

export async function setShopApproval(id: string, isApproved: boolean): Promise<void> {
  await updateDoc(doc(db, 'shops', id), { isApproved });
}

export async function setShopSuspended(id: string, isSuspended: boolean): Promise<void> {
  await updateDoc(doc(db, 'shops', id), { isSuspended });
}

export async function setUserActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isActive });
}

export async function getReportSummary(): Promise<ReportSummary> {
  const [users, shops, products, orders] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'shops')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'orders')),
  ]);
  let revenue = 0;
  orders.forEach((entry) => {
    const data = entry.data();
    if (data.status !== 'cancelled' && typeof data.total === 'number') revenue += data.total;
  });
  return {
    customers: users.docs.filter((entry) => entry.data().role === 'customer').length,
    shops: shops.size,
    products: products.size,
    orders: orders.size,
    revenue,
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [users, shops, products, orders] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'shops')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'orders')),
  ]);
  const statusCounts = Object.fromEntries(
    (
      ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled', 'rejected'] as OrderStatus[]
    ).map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;
  const shopsById = new Map(shops.docs.map((entry) => [entry.id, String(entry.data().name ?? 'Unknown shop')]));
  const performance = new Map<string, { shopName: string; orders: number; revenue: number }>();
  let revenue = 0;

  orders.docs.forEach((entry) => {
    const data = entry.data();
    const status = data.status as OrderStatus;
    if (status in statusCounts) statusCounts[status] += 1;
    const shopId = String(data.shopId ?? '');
    const shopName = shopsById.get(shopId) ?? 'Unknown shop';
    const current = performance.get(shopId) ?? { shopName, orders: 0, revenue: 0 };
    current.orders += 1;
    if (status !== 'cancelled' && status !== 'rejected') {
      const orderTotal = Number(data.total) || 0;
      current.revenue += orderTotal;
      revenue += orderTotal;
    }
    performance.set(shopId, current);
  });

  return {
    summary: {
      customers: users.docs.filter((entry) => entry.data().role === 'customer').length,
      shops: shops.size,
      products: products.size,
      orders: orders.size,
      revenue,
    },
    statusCounts,
    shopPerformance: [...performance.values()].sort((left, right) => right.revenue - left.revenue),
  };
}

export async function getOwnerSummary(ownerId: string): Promise<OwnerSummary> {
  const shops = await listOwnerShops(ownerId);
  const shopIds = new Set(shops.map((shop) => shop.id));
  const [products, orders] = await Promise.all([
    listOwnerProducts(ownerId),
    getDocs(collection(db, 'orders')),
  ]);
  const ownerOrders = orders.docs
    .map((entry) => entry.data())
    .filter((order) => typeof order.shopId === 'string' && shopIds.has(order.shopId));
  const countedAsSale = new Set(['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed']);

  return {
    sales: ownerOrders.reduce(
      (total, order) => (countedAsSale.has(order.status) ? total + (Number(order.total) || 0) : total),
      0,
    ),
    pendingOrders: ownerOrders.filter((order) => order.status === 'pending').length,
    products: products.length,
    lowStock: products.filter((product) => product.stockKg <= product.minStockKg).length,
  };
}
