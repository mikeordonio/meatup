import { collection, getDocs, query, updateDoc, doc, where } from 'firebase/firestore';

import { db } from '@/firebase';
import type { Order, OrderStatus } from '@/models';

export async function listOrders(filters?: { customerId?: string; shopIds?: string[] }): Promise<Order[]> {
  const snapshot = filters?.customerId
    ? await getDocs(query(collection(db, 'orders'), where('customerId', '==', filters.customerId)))
    : await getDocs(collection(db, 'orders'));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as Order)
    .filter((order) => !filters?.shopIds || filters.shopIds.includes(order.shopId))
    .sort((left, right) => (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', id), { status });
}
