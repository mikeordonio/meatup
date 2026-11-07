<template>
  <ion-page>
    <ion-content class="dashboard-content">
      <div class="dashboard-container">
        <div class="page-heading">
          <div>
            <p class="eyebrow">{{ roleLabel.toUpperCase() }} DASHBOARD</p>
            <h1>{{ heading }}</h1>
            <p>{{ description }}</p>
          </div>
          <ion-button v-if="role === 'owner'" router-link="/app/owner/products"
            ><ion-icon slot="start" :icon="addOutline" /> Add product</ion-button
          >
        </div>
        <div class="stat-grid">
          <ion-card v-for="stat in stats" :key="stat.label"
            ><ion-card-content
              ><span class="stat-icon">{{ stat.icon }}</span>
              <p>{{ stat.label }}</p>
              <h2>{{ stat.value }}</h2>
              <small>{{ stat.detail }}</small></ion-card-content
            ></ion-card
          >
        </div>
        <div class="content-grid">
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ role === 'admin' ? 'Platform activity' : 'Recent orders' }}</ion-card-title>
              <ion-card-subtitle>{{
                role === 'admin' ? 'Monitor the marketplace at a glance' : 'Your latest customer activity'
              }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="empty-state">
                <ion-icon :icon="receiptOutline" />
                <p>No activity to show yet.</p>
                <ion-button
                  fill="outline"
                  :router-link="
                    role === 'owner' ? '/app/owner/orders' : role === 'admin' ? '/app/admin/orders' : '/app/orders'
                  "
                  >View all</ion-button
                >
              </div>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header><ion-card-title>Getting started</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item v-for="step in steps" :key="step">
                  <ion-icon slot="start" :icon="checkmarkCircleOutline" color="success" />
                  <ion-label>{{ step }}</ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
} from '@ionic/vue';
import { addOutline, checkmarkCircleOutline, receiptOutline } from 'ionicons/icons';
import { computed } from 'vue';

import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const role = computed(() => authStore.role ?? 'customer');
const roleLabel = computed(() => (role.value === 'owner' ? 'Shop owner' : 'Administrator'));
const heading = computed(() => (role.value === 'owner' ? 'Run your shop with confidence.' : 'Keep MeatUp moving.'));
const description = computed(() =>
  role.value === 'owner'
    ? 'Manage products, inventory, and incoming orders in one place.'
    : 'A clear view of users, shops, orders, and platform performance.',
);
const stats = computed(() =>
  role.value === 'owner'
    ? [
        { label: 'Today’s sales', value: '₱0.00', detail: 'No completed orders', icon: '₱' },
        { label: 'Pending orders', value: '0', detail: 'Awaiting action', icon: '🧾' },
        { label: 'Products', value: '0', detail: 'Add your first product', icon: '🥩' },
        { label: 'Low stock', value: '0', detail: 'All stock levels healthy', icon: '📦' },
      ]
    : [
        { label: 'Customers', value: '0', detail: 'Registered accounts', icon: '👥' },
        { label: 'Active shops', value: '0', detail: 'Approved shops', icon: '🏪' },
        { label: 'Total orders', value: '0', detail: 'Across the platform', icon: '🧾' },
        { label: 'Revenue', value: '₱0.00', detail: 'Platform total', icon: '₱' },
      ],
);
const steps = computed(() =>
  role.value === 'owner'
    ? ['Complete your shop profile', 'Add your first products', 'Set your inventory levels']
    : ['Review pending shop approvals', 'Monitor platform orders', 'Check activity logs'],
);
</script>

<style scoped>
.page-heading {
  align-items: end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.dashboard-content {
  --background: var(--meatup-background);
}
.dashboard-container {
  margin: 0 auto;
  max-width: 1180px;
  padding: 2rem 1rem 6rem;
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.5rem;
}
h1 {
  color: var(--meatup-text);
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  margin: 0;
}
.page-heading p:last-child {
  color: var(--meatup-muted);
  margin-bottom: 0;
}
.stat-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 1.25rem;
}
.stat-grid ion-card,
.content-grid ion-card {
  border-radius: 16px;
  margin: 0;
}
.stat-grid ion-card-content {
  padding: 1.15rem;
}
.stat-icon {
  font-size: 1.5rem;
}
.stat-grid p {
  color: var(--meatup-muted);
  font-size: 0.78rem;
  margin: 0.6rem 0 0;
}
.stat-grid h2 {
  margin: 0.25rem 0;
}
.stat-grid small {
  color: var(--meatup-muted);
  font-size: 0.7rem;
}
.content-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}
.empty-state {
  align-items: center;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  text-align: center;
}
.empty-state ion-icon {
  font-size: 2rem;
}
ion-card-title {
  color: var(--meatup-text);
}
@media (min-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .content-grid {
    grid-template-columns: 1.2fr 0.8fr;
  }
}
@media (max-width: 500px) {
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
}
</style>
