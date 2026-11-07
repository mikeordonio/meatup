<template>
  <ion-page>
    <ion-content class="dashboard-content">
      <div class="page">
        <p class="eyebrow">{{ isCustomer ? 'YOUR ACTIVITY' : 'FULFILLMENT' }}</p>
        <h1>{{ isCustomer ? 'Your orders' : 'Manage orders' }}</h1>
        <p class="intro">
          {{
            isCustomer
              ? 'Track every order from local meat shops.'
              : 'Keep customers updated as orders move through your shop.'
          }}
        </p>
        <ion-text v-if="errorMessage" color="danger"><p>{{ errorMessage }}</p></ion-text>
        <div v-if="loading" class="state"><ion-spinner /></div>
        <ion-list v-else-if="orders.length">
          <ion-item v-for="order in orders" :key="order.id">
            <ion-label>
              <h2>Order #{{ order.id.slice(0, 8) }}</h2>
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
</style>
