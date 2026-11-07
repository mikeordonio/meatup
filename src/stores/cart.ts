import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { CartItem, Product } from '@/models';

const storageKey = 'meatup-cart';

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as CartItem[];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(readCart());
  const shopId = computed(() => items.value[0]?.product.shopId ?? null);
  const count = computed(() => items.value.reduce((total, item) => total + item.quantityKg, 0));
  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.product.pricePerKg * item.quantityKg, 0),
  );

  watch(items, (value) => localStorage.setItem(storageKey, JSON.stringify(value)), { deep: true });

  function add(product: Product): boolean {
    if (shopId.value && shopId.value !== product.shopId) {
      return false;
    }
    const existing = items.value.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantityKg = Number((existing.quantityKg + 0.25).toFixed(2));
    } else {
      items.value.push({ product, quantityKg: 0.25 });
    }
    return true;
  }

  function increase(productId: string): void {
    const item = items.value.find((entry) => entry.product.id === productId);
    if (item) item.quantityKg = Number((item.quantityKg + 0.25).toFixed(2));
  }

  function decrease(productId: string): void {
    const item = items.value.find((entry) => entry.product.id === productId);
    if (!item) return;
    if (item.quantityKg <= 0.25) {
      remove(productId);
    } else {
      item.quantityKg = Number((item.quantityKg - 0.25).toFixed(2));
    }
  }

  function remove(productId: string): void {
    items.value = items.value.filter((item) => item.product.id !== productId);
  }

  function clear(): void {
    items.value = [];
  }

  return { items, shopId, count, subtotal, add, increase, decrease, remove, clear };
});
