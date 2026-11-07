<template>
  <ion-page>
    <ion-header class="list-header"
      ><ion-toolbar><ion-title>Find a shop</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <div class="page-container">
        <div class="page-heading">
          <p class="eyebrow">LOCAL SHOPS</p>
          <h1>Fresh meat, close to home.</h1>
          <p>Explore approved meat shops across Oriental Mindoro.</p>
        </div>
        <div class="toolbar-row">
          <ion-searchbar v-model="search" placeholder="Search by shop name" />
          <span class="shop-count">{{ filteredShops.length }} {{ filteredShops.length === 1 ? 'shop' : 'shops' }}</span>
        </div>
        <section class="map-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SHOP LOCATOR</p>
              <h2>Find meat shops near you</h2>
            </div>
            <span class="region-pill">Oriental Mindoro</span>
          </div>
          <ShopMap :shops="filteredShops" />
        </section>
        <ion-text v-if="errorMessage" color="danger"
          ><p>{{ errorMessage }}</p></ion-text
        >
        <div v-if="loading" class="state"><ion-spinner /></div>
        <div v-else-if="filteredShops.length" class="shop-grid">
          <ion-card v-for="shop in filteredShops" :key="shop.id" button @click="openShop(shop.id)">
            <div class="shop-image">
              <img v-if="shop.imageUrl" :src="shop.imageUrl" :alt="shop.name" />
              <span v-else>🥩</span>
            </div>
            <ion-card-header
              ><ion-card-title>{{ shop.name }}</ion-card-title
              ><ion-card-subtitle>{{ shop.address }}</ion-card-subtitle></ion-card-header
            >
            <ion-card-content
              ><p>{{ shop.description || 'Fresh pork and chicken cuts from your local shop.' }}</p>
              <p class="shop-address">{{ shop.address }}</p>
              <ion-chip :color="shop.isOpen ? 'success' : 'medium'">{{
                shop.isOpen ? 'Open now' : 'Closed'
              }}</ion-chip></ion-card-content
            >
          </ion-card>
        </div>
        <div v-else class="state">
          <ion-icon :icon="storefrontOutline" />
          <h2>No shops found</h2>
          <p>Approved local shops will appear here.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { storefrontOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';

import { listShops } from '@/services/marketplace';
import type { Shop } from '@/models';
import ShopMap from '@/components/ShopMap.vue';

const router = useRouter();
const route = useRoute();
const shops = ref<Shop[]>([]);
const search = ref(String(route.query.search ?? ''));
const loading = ref(true);
const errorMessage = ref('');
const filteredShops = computed(() =>
  shops.value.filter((shop) => shop.name.toLowerCase().includes(search.value.toLowerCase())),
);

onMounted(async () => {
  try {
    shops.value = await listShops();
  } catch {
    errorMessage.value = 'Unable to load shops right now.';
  } finally {
    loading.value = false;
  }
});

function openShop(shopId: string): void {
  void router.push(`/app/shops/${shopId}`);
}
</script>

<style scoped>
.page-container {
  margin: 0 auto;
  max-width: 1180px;
  padding: 1.25rem 1rem 5rem;
}
.page-heading {
  margin: 1rem 0 1.5rem;
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.4rem;
}
h1 {
  color: var(--meatup-text);
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  margin: 0;
}
.page-heading p:last-child {
  color: var(--meatup-muted);
}
ion-searchbar {
  --background: white;
  --border-radius: 12px;
  padding: 0;
}
.toolbar-row {
  align-items: center;
  display: flex;
  gap: 1rem;
}
.shop-count {
  color: var(--meatup-muted);
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 700;
}
.map-section {
  background: white;
  border: 1px solid #eee2da;
  border-radius: 18px;
  margin-top: 1rem;
  padding: 1rem;
}
.section-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.3rem;
}
.section-heading h2 {
  font-size: 1.15rem;
  margin: 0;
}
.region-pill {
  background: #fff3e5;
  border-radius: 999px;
  color: var(--meatup-primary);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.45rem 0.65rem;
}
.shop-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-top: 1.25rem;
}
ion-card {
  border-radius: 16px;
  margin: 0;
}
.shop-image {
  align-items: center;
  background: #fae7d0;
  display: flex;
  font-size: 4rem;
  height: 130px;
  justify-content: center;
}
ion-card-content p {
  color: var(--meatup-muted);
  min-height: 40px;
}
.shop-address {
  font-size: 0.78rem;
  margin-bottom: 0.7rem;
  min-height: 0;
}
.state {
  align-items: center;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  padding: 4rem 1rem;
  text-align: center;
}
.state ion-icon {
  color: var(--meatup-primary);
  font-size: 2.5rem;
}
@media (max-width: 520px) {
  .toolbar-row {
    align-items: stretch;
    flex-direction: column;
    gap: 0.35rem;
  }
  .shop-count {
    padding-left: 0.5rem;
  }
  .map-section {
    padding: 0.75rem;
  }
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.55rem;
  }
}
</style>
