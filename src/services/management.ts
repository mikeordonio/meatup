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
import type { Product, ReportSummary, Shop, UserProfile } from '@/models';

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
