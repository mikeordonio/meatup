<template>
  <ion-page>
    <ion-header
      ><ion-toolbar
        ><ion-buttons slot="start"><ion-back-button default-href="/app/cart" /></ion-buttons
        ><ion-title>Checkout</ion-title></ion-toolbar
      ></ion-header
    >
    <ion-content>
      <div class="page-container">
        <div class="page-heading">
          <p class="eyebrow">FINAL STEP</p>
          <h1>Review your order</h1>
        </div>
        <ion-text v-if="errorMessage" color="danger"
          ><p>{{ errorMessage }}</p></ion-text
        >
        <ion-card
          ><ion-card-header><ion-card-title>Fulfillment method</ion-card-title></ion-card-header
          ><ion-card-content
            ><ion-segment v-model="method"
              ><ion-segment-button value="pickup">Store pickup</ion-segment-button
              ><ion-segment-button value="delivery">Home delivery</ion-segment-button></ion-segment
            ><ion-item v-if="method === 'delivery'"
              ><ion-textarea v-model="address" label="Delivery address" label-placement="stacked" :rows="3" required
            /></ion-item>
            <p v-else class="hint">
              Pick up your order from the shop. The shop address will be shown after checkout.
            </p></ion-card-content
          ></ion-card
        >
        <ion-card
          ><ion-card-header><ion-card-title>Order summary</ion-card-title></ion-card-header
          ><ion-card-content
            ><div v-for="item in cart.items" :key="item.product.id" class="summary-row">
              <span>{{ item.quantityKg.toFixed(2) }} kg {{ item.product.name }}</span
              ><strong>₱{{ (item.product.pricePerKg * item.quantityKg).toFixed(2) }}</strong>
            </div>
            <div class="summary-row">
              <span>Subtotal</span><strong>₱{{ cart.subtotal.toFixed(2) }}</strong>
            </div>
            <div class="summary-row">
              <span>Delivery fee</span><strong>{{ method === 'delivery' ? '₱50.00' : '₱0.00' }}</strong>
            </div>
            <div class="summary-row total">
              <span>Total</span><strong>₱{{ total.toFixed(2) }}</strong>
            </div>
            <ion-button expand="block" :disabled="submitting || !cart.items.length" @click="submit">{{
              submitting ? 'Placing order...' : 'Place order'
            }}</ion-button></ion-card-content
          ></ion-card
        >
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { createOrder } from '@/services/orders';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const authStore = useAuthStore();
const cart = useCartStore();
const method = ref<'pickup' | 'delivery'>('pickup');
const address = ref(authStore.profile?.defaultAddress ?? '');
const submitting = ref(false);
const errorMessage = ref('');
const deliveryFee = 50;
const total = computed(() => cart.subtotal + (method.value === 'delivery' ? deliveryFee : 0));

async function submit(): Promise<void> {
  if (method.value === 'delivery' && !address.value.trim()) {
    errorMessage.value = 'Enter a complete delivery address.';
    return;
  }
  if (!authStore.profile) return;
  submitting.value = true;
  errorMessage.value = '';
  try {
    const orderId = await createOrder({
      customerId: authStore.profile.uid,
      items: cart.items,
      fulfillmentMethod: method.value,
      deliveryAddress: address.value.trim(),
      deliveryFee,
    });
    cart.clear();
    await router.replace(`/app/orders/${orderId}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to place your order.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page-container {
  margin: 0 auto;
  max-width: 900px;
  padding: 1.5rem 1rem 5rem;
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
h1 {
  margin-top: 0;
}
ion-card {
  border-radius: 16px;
  margin: 0 0 1rem;
}
.hint {
  color: var(--meatup-muted);
  font-size: 0.85rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
}
.total {
  border-top: 1px solid #eadfd8;
  font-size: 1.2rem;
  margin: 0.5rem 0 1rem;
  padding-top: 1rem;
}
</style>
