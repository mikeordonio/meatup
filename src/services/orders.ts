import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '@/firebase';
import type { CartItem, Order } from '@/models';

export async function createOrder(input: {
  customerId: string;
  items: CartItem[];
  fulfillmentMethod: 'pickup' | 'delivery';
  deliveryAddress: string;
  deliveryFee: number;
}): Promise<string> {
  if (!input.items.length) throw new Error('Your cart is empty.');
  const orderRef = doc(collection(db, 'orders'));
  await runTransaction(db, async (transaction) => {
    const orderItems = [];
    let subtotal = 0;
    for (const item of input.items) {
      const productRef = doc(db, 'products', item.product.id);
      const productSnapshot = await transaction.get(productRef);
      if (!productSnapshot.exists()) throw new Error(`${item.product.name} is no longer available.`);
      const product = productSnapshot.data();
      if (typeof product.stockKg !== 'number' || product.stockKg < item.quantityKg) {
        throw new Error(`Not enough stock for ${item.product.name}.`);
      }
      const total = Number((product.pricePerKg * item.quantityKg).toFixed(2));
      subtotal += total;
      orderItems.push({
        productId: item.product.id,
        productName: product.name,
        pricePerKg: product.pricePerKg,
        quantityKg: item.quantityKg,
        total,
      });
      transaction.update(productRef, { stockKg: Number((product.stockKg - item.quantityKg).toFixed(2)) });
    }
    const order: Omit<Order, 'id'> = {
      customerId: input.customerId,
      shopId: input.items[0].product.shopId,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: input.fulfillmentMethod === 'delivery' ? input.deliveryFee : 0,
      total: Number((subtotal + (input.fulfillmentMethod === 'delivery' ? input.deliveryFee : 0)).toFixed(2)),
      fulfillmentMethod: input.fulfillmentMethod,
      deliveryAddress: input.deliveryAddress,
      status: 'pending',
    };
    transaction.set(orderRef, { ...order, createdAt: serverTimestamp() });
  });
  return orderRef.id;
}
