import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/firebase';
import type { Product, Shop } from '@/models';

export async function listShops(): Promise<Shop[]> {
  const snapshot = await getDocs(query(collection(db, 'shops'), where('isApproved', '==', true)));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as Shop)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listProducts(shopId: string): Promise<Product[]> {
  const snapshot = await getDocs(
    query(collection(db, 'products'), where('shopId', '==', shopId), where('isAvailable', '==', true)),
  );
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as Product)
    .sort((left, right) => left.name.localeCompare(right.name));
}
