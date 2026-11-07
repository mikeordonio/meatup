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
          @ion-input="searchShops"
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
import { IonButton, IonCard, IonCardContent, IonContent, IonIcon, IonPage, IonSearchbar } from '@ionic/vue';
import { storefrontOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const search = ref('');
const firstName = computed(() => authStore.profile?.fullName.split(' ')[0] ?? 'there');
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
  .category-grid ion-card:nth-child(n + 3) {
    display: none;
  }
}
</style>
