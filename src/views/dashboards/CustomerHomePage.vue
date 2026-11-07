<template>
  <ion-page>
    <ion-content class="dashboard-content">
      <div class="dashboard-container">
        <section class="welcome">
          <div>
            <p class="eyebrow">GOOD DAY, {{ firstName.toUpperCase() }}</p>
            <h1>What are you cooking today?</h1>
            <p class="subheading">Fresh pork and chicken from shops near you.</p>
          </div>
          <div class="welcome-art">🥩</div>
        </section>
        <ion-searchbar
          v-model="search"
          placeholder="Search pork, chicken, or a shop"
          :debounce="300"
          @ion-change="searchShops"
        />
        <div class="section-heading">
          <div>
            <p class="eyebrow">EXPLORE</p>
            <h2>Shop by category</h2>
          </div>
          <ion-button fill="clear" router-link="/app/shops">View all</ion-button>
        </div>
        <div class="category-grid">
          <ion-card v-for="category in categories" :key="category.name" button @click="selectCategory(category.search)">
            <ion-card-content
              ><span class="category-icon">{{ category.icon }}</span
              ><strong>{{ category.name }}</strong
              ><small>{{ category.description }}</small></ion-card-content
            >
          </ion-card>
        </div>
        <div class="section-heading">
          <div>
            <p class="eyebrow">NEARBY AND APPROVED</p>
            <h2>Popular shops</h2>
          </div>
          <ion-button fill="clear" router-link="/app/shops">View all</ion-button>
        </div>
        <div v-if="shopsLoading" class="shop-loading"><ion-spinner /></div>
        <div v-else-if="featuredShops.length" class="featured-shops">
          <ion-card v-for="shop in featuredShops" :key="shop.id" button @click="openShop(shop.id)">
            <div class="featured-image">
              <img v-if="shop.imageUrl" :src="shop.imageUrl" :alt="shop.name" />
              <span v-else>🥩</span>
            </div>
            <ion-card-content>
              <strong>{{ shop.name }}</strong>
              <small>{{ shop.address }}</small>
              <ion-chip :color="shop.isOpen ? 'success' : 'medium'">{{ shop.isOpen ? 'Open now' : 'Closed' }}</ion-chip>
            </ion-card-content>
          </ion-card>
        </div>
        <p v-else-if="shopsError" class="home-message">{{ shopsError }}</p>
        <p v-else class="home-message">Approved shops will appear here soon.</p>
        <div class="section-heading">
          <div>
            <p class="eyebrow">QUICK START</p>
            <h2>Your next order</h2>
          </div>
        </div>
        <ion-card class="empty-card">
          <ion-card-content
            ><ion-icon :icon="storefrontOutline" />
            <h3>Find a shop near you</h3>
            <p>Browse local meat shops and discover quality cuts for your next meal.</p>
            <ion-button router-link="/app/shops">Browse shops</ion-button></ion-card-content
          >
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonChip, IonContent, IonIcon, IonPage, IonSearchbar, IonSpinner } from '@ionic/vue';
import { storefrontOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Shop } from '@/models';
import { listShops } from '@/services/marketplace';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const search = ref('');
const shops = ref<Shop[]>([]);
const shopsLoading = ref(true);
const shopsError = ref('');
const firstName = computed(() => authStore.profile?.fullName.split(' ')[0] ?? 'there');
const featuredShops = computed(() => shops.value.slice(0, 4));
const categories = [
  { name: 'Pork cuts', icon: '🥩', description: 'Belly, chop, ribs and more', search: 'pork' },
  { name: 'Chicken', icon: '🍗', description: 'Fresh whole and portion cuts', search: 'chicken' },
];

function searchShops(): void {
  void router.push({ path: '/app/shops', query: { search: search.value || undefined } });
}

function selectCategory(category: string): void {
  search.value = category;
  searchShops();
}

function openShop(shopId: string): void {
  void router.push(`/app/shops/${shopId}`);
}

onMounted(async () => {
  try {
    shops.value = await listShops();
  } catch {
    shopsError.value = 'Unable to load nearby shops right now.';
  } finally {
    shopsLoading.value = false;
  }
});
</script>

<style scoped>
.welcome {
  align-items: center;
  background: linear-gradient(120deg, #7d171d, #a52b2e);
  border-radius: 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  overflow: hidden;
  padding: 1.75rem;
}
.dashboard-content {
  --background: var(--meatup-background);
}
.dashboard-container {
  margin: 0 auto;
  max-width: 1180px;
  padding: 1.5rem 1rem 6rem;
}
.shop-loading {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 7rem;
}
.featured-shops {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.featured-shops ion-card {
  --background: white;
  border: 1px solid #f0e2d9;
  border-radius: 14px;
}
.featured-image {
  align-items: center;
  background: #fae7d0;
  display: flex;
  height: 5.5rem;
  justify-content: center;
  overflow: hidden;
}
.featured-image img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.featured-image span {
  font-size: 2rem;
}
.featured-shops ion-card-content {
  padding: 0.7rem;
}
.featured-shops strong,
.featured-shops small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.featured-shops small {
  color: var(--meatup-muted);
  font-size: 0.72rem;
  margin-top: 0.25rem;
}
.featured-shops ion-chip {
  font-size: 0.65rem;
  margin: 0.45rem 0 0;
}
.home-message {
  color: var(--meatup-muted);
  font-size: 0.85rem;
  text-align: center;
}
.welcome > div:first-child {
  min-width: 0;
}
.eyebrow {
  color: var(--meatup-accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.5rem;
}
.welcome .eyebrow {
  color: #ffc98c;
}
h1 {
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  line-height: 1.1;
  margin: 0.25rem 0 0.6rem;
  max-width: 560px;
}
.subheading {
  color: #f8d8cc;
  margin: 0;
}
.welcome-art {
  font-size: 4rem;
  opacity: 0.9;
}
ion-searchbar {
  --background: white;
  --border-radius: 12px;
  --box-shadow: 0 3px 14px #43110d0d;
  margin: 1rem 0 2rem;
  padding: 0;
}
.category-grid ion-card {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.category-grid ion-card:hover {
  box-shadow: 0 10px 24px #43110d12;
  transform: translateY(-2px);
}
.section-heading {
  align-items: end;
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0 0.5rem;
}
.section-heading h2 {
  color: var(--meatup-text);
  margin: 0;
}
.category-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}
ion-card {
  margin: 0;
}
.category-grid ion-card {
  --background: white;
  border: 1px solid #f0e2d9;
  border-radius: 16px;
}
.category-grid ion-card-content {
  padding: 1.25rem;
}
.category-icon {
  display: block;
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}
.category-grid strong,
.category-grid small {
  display: block;
}
.category-grid small {
  color: var(--meatup-muted);
  font-size: 0.78rem;
  margin-top: 0.35rem;
}
.empty-card {
  border-radius: 16px;
  text-align: center;
}
.empty-card ion-card-content {
  padding: 2.25rem 1.25rem;
}
.empty-card ion-icon {
  color: var(--meatup-primary);
  font-size: 2.25rem;
}
.empty-card h3 {
  margin-bottom: 0.4rem;
}
.empty-card p {
  color: var(--meatup-muted);
  margin: 0 auto 1rem;
  max-width: 360px;
}
@media (min-width: 640px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 639px) {
    .dashboard-container {
      padding-top: 2rem;
    }
  }
  .category-grid ion-card:nth-child(n + 3) {
    display: none;
  }
}
</style>
