<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title><AppLogo /></ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Notifications">
            <ion-icon :icon="notificationsOutline" />
          </ion-button>
          <ion-button aria-label="Sign out" @click="logout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-menu content-id="main-content">
      <ion-content>
        <div class="menu-profile">
          <div class="avatar">{{ initials }}</div>
          <strong>{{ authStore.profile?.fullName }}</strong>
          <span>{{ roleLabel }}</span>
        </div>
        <ion-list lines="none">
          <ion-menu-toggle v-for="item in navigation" :key="item.href" :auto-hide="false">
            <ion-item :router-link="item.href" detail>
              <ion-icon slot="start" :icon="item.icon" />
              <ion-label>{{ item.label }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
      <ion-footer>
        <ion-item lines="none">
          <ion-label>
            <small>Signed in as</small>
            <p>{{ authStore.profile?.email }}</p>
          </ion-label>
        </ion-item>
      </ion-footer>
    </ion-menu>
    <ion-router-outlet id="main-content" class="app-content" />
    <ion-tab-bar class="mobile-tabs" slot="bottom">
      <ion-tab-button
        v-for="item in navigation.slice(0, 5)"
        :key="item.href"
        :class="{ 'tab-is-active': isActive(item.href) }"
        :href="item.href"
        @click.prevent="navigate(item.href)"
      >
        <ion-icon :icon="item.icon" />
        <ion-label>{{ item.label }}</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  barChartOutline,
  cartOutline,
  gridOutline,
  homeOutline,
  logOutOutline,
  notificationsOutline,
  personOutline,
  peopleOutline,
  receiptOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppLogo from '@/components/AppLogo.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const navigation = computed(() => {
  if (authStore.role === 'owner') {
    return [
      { label: 'Overview', href: '/app/owner', icon: gridOutline },
      { label: 'My shop', href: '/app/owner/shop', icon: storefrontOutline },
      { label: 'Orders', href: '/app/owner/orders', icon: receiptOutline },
      { label: 'Products', href: '/app/owner/products', icon: storefrontOutline },
      { label: 'Inventory', href: '/app/owner/inventory', icon: cartOutline },
      { label: 'Sales', href: '/app/owner/sales', icon: barChartOutline },
    ];
  }
  if (authStore.role === 'admin') {
    return [
      { label: 'Dashboard', href: '/app/admin', icon: gridOutline },
      { label: 'Users', href: '/app/admin/users', icon: peopleOutline },
      { label: 'Shops', href: '/app/admin/shops', icon: storefrontOutline },
      { label: 'Orders', href: '/app/admin/orders', icon: receiptOutline },
      { label: 'Reports', href: '/app/admin/reports', icon: barChartOutline },
    ];
  }
  return [
    { label: 'Home', href: '/app', icon: homeOutline },
    { label: 'Shops', href: '/app/shops', icon: storefrontOutline },
    { label: 'Cart', href: '/app/cart', icon: cartOutline },
    { label: 'Orders', href: '/app/orders', icon: receiptOutline },
    { label: 'Profile', href: '/app/profile', icon: personOutline },
  ];
});

const initials = computed(() =>
  authStore.profile?.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
);
const roleLabel = computed(() => {
  if (authStore.role === 'owner') return 'Shop owner';
  if (authStore.role === 'admin') return 'Administrator';
  return 'Customer';
});

async function logout(): Promise<void> {
  await authStore.logout();
  await router.replace('/login');
}

function isActive(href: string): boolean {
  return route.path === href || route.path.startsWith(`${href}/`);
}

async function navigate(href: string): Promise<void> {
  if (route.path === href) return;
  await router.push(href);
}
</script>

<style scoped>
.app-header ion-toolbar {
  --background: var(--meatup-cream);
  --border-width: 0;
}
.app-header :deep(.brand-image) {
  height: 42px;
  width: 145px;
}
.menu-profile {
  background: var(--meatup-primary);
  color: white;
  padding: 2rem 1.25rem 1.5rem;
}
.avatar {
  align-items: center;
  background: #f5b773;
  border-radius: 50%;
  color: var(--meatup-primary);
  display: flex;
  font-weight: 800;
  height: 48px;
  justify-content: center;
  margin-bottom: 0.75rem;
  width: 48px;
}
.menu-profile strong,
.menu-profile span {
  display: block;
}
.menu-profile span {
  color: #f5d2c4;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
ion-menu ion-item {
  --border-radius: 10px;
  margin: 0.2rem 0.65rem;
}
ion-menu ion-icon {
  color: var(--meatup-primary);
}
ion-footer small {
  color: var(--meatup-muted);
}
ion-footer p {
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-content {
  --background: var(--meatup-background);
  display: block;
}
.app-content ion-card {
  --background: #ffffff;
}
.app-content ion-button {
  font-weight: 700;
}
.mobile-tabs {
  --background: white;
  border-top: 1px solid #eadfd8;
}
.mobile-tabs ion-tab-button {
  --color: var(--meatup-muted);
  --color-selected: var(--meatup-primary);
}
.mobile-tabs ion-tab-button.tab-is-active {
  color: var(--meatup-primary);
  font-weight: 700;
}
@media (min-width: 768px) {
  ion-menu-button,
  .mobile-tabs {
    display: none;
  }
}
</style>
