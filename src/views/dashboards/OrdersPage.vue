<template>
  <ion-page>
    <ion-content class="dashboard-content">
      <div class="page">
        <p class="eyebrow">{{ isCustomer ? 'YOUR ACTIVITY' : 'FULFILLMENT' }}</p>
        <h1>{{ isCustomer ? 'Your orders' : 'Manage Orders' }}</h1>
        <p class="intro">
          {{
            isCustomer
              ? 'Track every order from local meat shops.'
              : 'Keep customers updated as orders move through your shop.'
          }}
        </p>
        <ion-text v-if="errorMessage" color="danger"><p>{{ errorMessage }}</p></ion-text>
        <div v-if="loading" class="state"><ion-spinner /></div>
        <ion-list v-else-if="orders.length" class="orders-list">
          <ion-item v-for="order in orders" :key="order.id" class="order-item">
            <ion-label>
              <h2><span class="order-prefix">Order</span> #{{ order.id.slice(0, 8) }}</h2>
              <p>{{ order.items.length }} item(s) · ₱{{ order.total.toFixed(2) }} · {{ order.fulfillmentMethod }}</p>
            </ion-label>
            <ion-select
              v-if="!isCustomer"
              :value="order.status"
              interface="popover"
              @ion-change="changeStatus(order.id, $event.detail.value)"
            >
              <ion-select-option v-for="status in statuses" :key="status" :value="status">{{
                status.replaceAll('_', ' ')
              }}</ion-select-option>
            </ion-select>
            <ion-chip v-else color="primary">{{ order.status.replaceAll('_', ' ') }}</ion-chip>
            <ion-button
              v-if="order.customerId && !isCustomer"
              fill="clear"
              size="small"
              @click="chatWithCustomer(order.customerId)"
            >
              Chat
            </ion-button>
            <ion-button
              v-if="order.shopId && isCustomer"
              fill="clear"
              size="small"
              @click="chatWithShop(order.shopId)"
            >
              Chat
            </ion-button>
          </ion-item>
        </ion-list>
        <div v-else class="state">
          <ion-icon :icon="receiptOutline" />
          <p>No orders yet.</p>
          <ion-button v-if="isCustomer" router-link="/app/shops">Browse shops</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/vue';
import { receiptOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';

import type { Order, OrderStatus } from '@/models';
import { listOwnerShops } from '@/services/management';
import { getUserProfile } from '@/services/chat';
import { listShops } from '@/services/marketplace';
import { listOrders, updateOrderStatus } from '@/services/order-management';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const orders = ref<Order[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const isCustomer = computed(() => auth.role === 'customer');
const statuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
  'rejected',
];

async function load(): Promise<void> {
  try {
    if (isCustomer.value) orders.value = await listOrders({ customerId: auth.profile!.uid });
    else if (auth.role === 'owner')
      orders.value = await listOrders({ shopIds: (await listOwnerShops(auth.profile!.uid)).map((shop) => shop.id) });
    else orders.value = await listOrders();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load orders.';
  } finally {
    loading.value = false;
  }
}
async function changeStatus(id: string, status: OrderStatus): Promise<void> {
  await updateOrderStatus(id, status);
  await load();
}
async function chatWithCustomer(customerId: string): Promise<void> {
  const customer = await getUserProfile(customerId);
  if (customer) window.dispatchEvent(new CustomEvent('meatup:start-chat', { detail: customer }));
}
async function chatWithShop(shopId: string): Promise<void> {
  const shop = (await listShops()).find((item) => item.id === shopId);
  const owner = shop ? await getUserProfile(shop.ownerId) : undefined;
  if (owner) window.dispatchEvent(new CustomEvent('meatup:start-chat', { detail: owner }));
}
onMounted(load);
</script>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 6rem;
}
.dashboard-content {
  --background: var(--meatup-background);
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.page h1 {
  margin: 0;
}
.intro {
  color: var(--meatup-muted);
}
.state {
  align-items: center;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  padding: 4rem;
  text-align: center;
}
.state ion-icon {
  font-size: 2.5rem;
}
.orders-list {
  background: transparent;
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.order-item {
  --background: #fff;
  --border-color: #eee4de;
  --border-radius: 14px;
  --inner-padding-end: 0.85rem;
  --padding-start: 0.9rem;
  border: 1px solid #eee4de;
  border-radius: 14px;
  box-shadow: 0 5px 16px rgb(74 37 22 / 5%);
}
.order-item::part(native) { min-height: 88px; }
.order-item ion-label { min-width: 0; }
.order-item ion-label h2 { color: var(--meatup-text); font-size: 0.95rem; font-weight: 700; }
.order-prefix { color: var(--meatup-muted); font-weight: 500; }
.order-item ion-label p { color: var(--meatup-muted); font-size: 0.78rem; line-height: 1.45; white-space: normal; }
.order-item ion-select {
  background: #fff8f0;
  border: 1px solid #f0ddd2;
  border-radius: 999px;
  color: var(--meatup-primary);
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 700;
  margin: 0 0.35rem;
  max-width: 150px;
  min-height: 2.2rem;
  padding: 0.25rem 0.65rem;
}
.order-item ion-chip { flex: 0 0 auto; font-size: 0.72rem; font-weight: 700; }
.order-item ion-button { --color: var(--meatup-primary); font-size: 0.76rem; font-weight: 700; margin: 0; }
@media (max-width: 600px) {
  .orders-list { gap: 0.65rem; }
  .order-item::part(native) { flex-wrap: wrap; gap: 0.25rem 0.5rem; padding-bottom: 0.6rem; padding-top: 0.6rem; }
  .order-item ion-label { flex: 1 1 100%; margin: 0.25rem 0; }
  .order-item ion-select { margin-left: 0; }
}
</style>
