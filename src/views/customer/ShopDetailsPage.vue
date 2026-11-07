<template>
  <ion-page>
    <ion-header
      ><ion-toolbar
        ><ion-buttons slot="start"><ion-back-button default-href="/app/shops" /></ion-buttons
        ><ion-title>{{ shop?.name || 'Shop details' }}</ion-title></ion-toolbar
      ></ion-header
    >
    <ion-content>
      <div class="page-container">
        <ion-text v-if="errorMessage" color="danger"
          ><p>{{ errorMessage }}</p></ion-text
        >
        <div v-if="loading" class="state"><ion-spinner /></div>
        <template v-else-if="shop">
          <section class="shop-banner">
            <div class="shop-icon">🥩</div>
            <div>
              <p class="eyebrow">{{ shop.isOpen ? 'OPEN NOW' : 'CLOSED' }}</p>
              <h1>{{ shop.name }}</h1>
              <p>{{ shop.address }}</p>
            </div>
            <ion-button v-if="shop.ownerId" fill="outline" color="light" @click="chatWithOwner">Chat with owner</ion-button>
          </section>
          <ShopMap
            v-if="typeof shop.latitude === 'number' && typeof shop.longitude === 'number'"
            :shops="[shop]"
            :latitude="shop.latitude"
            :longitude="shop.longitude"
          />
          <div class="section-heading">
            <div>
              <p class="eyebrow">AVAILABLE TODAY</p>
              <h2>Fresh cuts</h2>
            </div>
            <ion-segment v-model="category"
              ><ion-segment-button value="all">All</ion-segment-button
              ><ion-segment-button value="Pork">Pork</ion-segment-button
              ><ion-segment-button value="Chicken">Chicken</ion-segment-button></ion-segment
            >
          </div>
          <div class="product-grid">
            <ion-card v-for="product in filteredProducts" :key="product.id"
              ><div class="product-image">
                <img v-if="product.imageData" :src="product.imageData" :alt="product.name" /><span v-else>{{
                  product.category === 'Pork' ? '🥩' : '🍗'
                }}</span>
              </div>
              <ion-card-content
                ><ion-card-title>{{ product.name }}</ion-card-title>
                <p class="description">{{ product.description }}</p>
                <div class="product-footer">
                  <strong>₱{{ product.pricePerKg.toFixed(2) }}<small>/kg</small></strong
                  ><ion-button size="small" @click="addToCart(product)">Add</ion-button>
                </div></ion-card-content
              ></ion-card
            >
          </div>
          <div v-if="!filteredProducts.length" class="state"><p>No products are available in this category.</p></div>
        </template>
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
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { listProducts, listShops } from '@/services/marketplace';
import { getUserProfile } from '@/services/chat';
import { useCartStore } from '@/stores/cart';
import type { Product, Shop } from '@/models';
import ShopMap from '@/components/ShopMap.vue';

const route = useRoute();
const cart = useCartStore();
const shop = ref<Shop>();
const products = ref<Product[]>([]);
const category = ref('all');
const loading = ref(true);
const errorMessage = ref('');
const filteredProducts = computed(() =>
  products.value.filter((product) => category.value === 'all' || product.category === category.value),
);

onMounted(async () => {
  try {
    const shops = await listShops();
    shop.value = shops.find((entry) => entry.id === route.params.shopId);
    if (!shop.value) throw new Error('Shop not found');
    products.value = await listProducts(shop.value.id);
  } catch {
    errorMessage.value = 'Unable to load this shop right now.';
  } finally {
    loading.value = false;
  }
});

async function addToCart(product: Product): Promise<void> {
  if (!cart.add(product)) {
    const toast = await toastController.create({
      message: 'Your cart contains products from another shop.',
      duration: 2500,
      buttons: [
        {
          text: 'Clear cart',
          role: 'destructive',
          handler: () => {
            cart.clear();
            cart.add(product);
          },
        },
      ],
    });
    await toast.present();
    return;
  }
  const toast = await toastController.create({ message: `${product.name} added to cart`, duration: 1400 });
  await toast.present();
}

async function chatWithOwner(): Promise<void> {
  if (!shop.value) return;
  const owner = await getUserProfile(shop.value.ownerId);
  if (owner) window.dispatchEvent(new CustomEvent('meatup:start-chat', { detail: owner }));
}
</script>

<style scoped>
.page-container {
  margin: 0 auto;
  max-width: 1180px;
  padding: 1.5rem 1rem 5rem;
}
.shop-banner {
  align-items: center;
  background: linear-gradient(120deg, #7d171d, #a52b2e);
  border-radius: 18px;
  color: white;
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
}
.shop-icon {
  font-size: 3rem;
}
.eyebrow {
  color: #ffc98c;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.4rem;
}
h1 {
  margin: 0;
}
.shop-banner p:last-child {
  color: #f5d2c4;
  margin-bottom: 0;
}
.section-heading {
  align-items: end;
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0 1rem;
}
.section-heading .eyebrow {
  color: var(--meatup-primary);
}
h2 {
  margin: 0;
}
ion-segment {
  max-width: 260px;
}
.product-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
ion-card {
  border-radius: 16px;
  margin: 0;
}
.product-image {
  align-items: center;
  background: #fae7d0;
  display: flex;
  font-size: 3.5rem;
  height: 130px;
  justify-content: center;
}
.description {
  color: var(--meatup-muted);
  font-size: 0.82rem;
  min-height: 35px;
}
.product-footer {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
.product-footer strong {
  color: var(--meatup-primary);
  font-size: 1.1rem;
}
.product-footer small {
  color: var(--meatup-muted);
  font-size: 0.7rem;
  font-weight: 400;
}
.state {
  color: var(--meatup-muted);
  padding: 3rem;
  text-align: center;
}
</style>
