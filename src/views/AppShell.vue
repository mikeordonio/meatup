<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title><AppLogo /></ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Notifications" @click="showNotifications">
            <ion-icon :icon="notificationsOutline" />
            <ion-badge v-if="unreadCount" color="danger">{{ unreadCount > 9 ? '9+' : unreadCount }}</ion-badge>
          </ion-button>
          <ion-button aria-label="Sign out" @click="logout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-popover
      :is-open="notificationsOpen"
      class="notifications-popover"
      side="bottom"
      alignment="end"
      @did-dismiss="notificationsOpen = false"
    >
      <ion-content>
        <div class="notification-heading">
          <strong>Notifications</strong>
          <ion-button v-if="unreadCount" fill="clear" size="small" @click="markNotificationsRead">
            Mark all read
          </ion-button>
        </div>
        <div v-if="!notifications.length" class="notifications-empty">
          <ion-icon :icon="checkmarkCircleOutline" />
          <strong>You're all caught up</strong>
          <span>No new notifications right now.</span>
        </div>
        <ion-list v-else lines="none">
          <ion-item
            v-for="notification in notifications"
            :key="notification.id"
            button
            :class="{ 'notification-unread': !readNotificationIds.includes(notification.id) }"
            @click="openNotification(notification)"
          >
            <span v-if="!readNotificationIds.includes(notification.id)" class="unread-dot"></span>
            <ion-label>
              <h2>{{ notification.title }}</h2>
              <p>{{ notification.message }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
    <ion-menu content-id="main-content">
      <ion-content>
        <div class="menu-profile">
          <div class="avatar">
            <img v-if="authStore.profile?.profileImage" :src="authStore.profile.profileImage" alt="Profile picture" />
            <span v-else>{{ initials }}</span>
          </div>
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
    <ion-router-outlet id="main-content" class="app-content" :animated="false" />
    <ChatWidget v-if="authStore.role !== 'admin'" />
    <nav class="mobile-tabs" aria-label="Primary navigation">
      <button
        v-for="item in navigation.slice(0, 5)"
        :key="item.href"
        type="button"
        :class="{ 'tab-is-active': isActive(item.href) }"
        @click="navigate(item.href)"
      >
        <ion-icon :icon="item.icon" />
        <ion-label>{{ item.label }}</ion-label>
      </button>
    </nav>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonBadge,
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
  IonPopover,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  alertController,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  barChartOutline,
  cartOutline,
  gridOutline,
  homeOutline,
  logOutOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  personOutline,
  peopleOutline,
  receiptOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppLogo from '@/components/AppLogo.vue';
import ChatWidget from '@/components/ChatWidget.vue';
import { listNotifications } from '@/services/notifications';
import type { AppNotification } from '@/models';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const notifications = ref<AppNotification[]>([]);
const notificationsOpen = ref(false);
const readNotificationIds = ref<string[]>(JSON.parse(localStorage.getItem('meatup-read-notifications') ?? '[]'));
const unreadCount = computed(() => notifications.value.filter((item) => !readNotificationIds.value.includes(item.id)).length);

const navigation = computed(() => {
  if (authStore.role === 'owner') {
    return [
      { label: 'Dashboard', href: '/app/owner', icon: gridOutline },
      { label: 'My shop', href: '/app/owner/shop', icon: storefrontOutline },
      { label: 'Orders', href: '/app/owner/orders', icon: receiptOutline },
      { label: 'Products', href: '/app/owner/products', icon: storefrontOutline },
      { label: 'Inventory', href: '/app/owner/inventory', icon: cartOutline },
      { label: 'Sales', href: '/app/owner/sales', icon: barChartOutline },
      { label: 'Profile', href: '/app/profile', icon: personOutline },
    ];
  }
  if (authStore.role === 'admin') {
    return [
      { label: 'Dashboard', href: '/app/admin', icon: gridOutline },
      { label: 'Users', href: '/app/admin/users', icon: peopleOutline },
      { label: 'Shops', href: '/app/admin/shops', icon: storefrontOutline },
      { label: 'Orders', href: '/app/admin/orders', icon: receiptOutline },
      { label: 'Reports', href: '/app/admin/reports', icon: barChartOutline },
      { label: 'Profile', href: '/app/profile', icon: personOutline },
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
  const alert = await alertController.create({
    header: 'Log out?',
    message: 'Are you sure you want to log out of MeatUp Macatoc?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Log out', role: 'confirm' },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  if (role !== 'confirm') return;

  await authStore.logout();
  await router.replace('/login');
}

async function loadNotifications(): Promise<void> {
  if (!authStore.profile || !authStore.role) return;
  try {
    notifications.value = await listNotifications(authStore.role, authStore.profile.uid);
  } catch {
    notifications.value = [];
  }
}

async function showNotifications(): Promise<void> {
  await loadNotifications();
  notificationsOpen.value = true;
}

async function openNotification(notification: AppNotification): Promise<void> {
  readNotificationIds.value = [...new Set([...readNotificationIds.value, notification.id])];
  localStorage.setItem('meatup-read-notifications', JSON.stringify(readNotificationIds.value));
  notificationsOpen.value = false;
  if (notification.route) await router.push(notification.route);
}

function markNotificationsRead(): void {
  readNotificationIds.value = notifications.value.map((item) => item.id);
  localStorage.setItem('meatup-read-notifications', JSON.stringify(readNotificationIds.value));
}

onIonViewWillEnter(loadNotifications);

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
.notifications-popover {
  --width: min(360px, calc(100vw - 1rem));
}
.notifications-popover ion-content {
  --background: white;
  max-height: 430px;
}
.notification-heading {
  align-items: center;
  border-bottom: 1px solid #eee2da;
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0.85rem 0.55rem;
}
.notification-heading strong {
  color: var(--meatup-text);
}
.notification-heading ion-button {
  font-size: 0.72rem;
  margin: 0;
}
.notifications-empty {
  align-items: center;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 2rem 1rem;
  text-align: center;
}
.notifications-empty ion-icon {
  color: #16a34a;
  font-size: 2rem;
  margin-bottom: 0.25rem;
}
.notifications-empty strong {
  color: var(--meatup-text);
}
.notifications-empty span {
  font-size: 0.78rem;
}
.notifications-popover ion-item {
  --padding-start: 0.85rem;
  --inner-padding-end: 0.85rem;
  align-items: flex-start;
  border-bottom: 1px solid #f4ece7;
}
.notifications-popover ion-item.notification-unread {
  --background: #fff8f0;
}
.notifications-popover ion-label {
  margin: 0.7rem 0;
}
.notifications-popover ion-label h2 {
  color: var(--meatup-text);
  font-size: 0.82rem;
  font-weight: 800;
  margin: 0 0 0.2rem;
}
.notifications-popover ion-label p {
  color: var(--meatup-muted);
  font-size: 0.75rem;
  margin: 0;
  white-space: normal;
}
.unread-dot {
  background: var(--meatup-primary);
  border-radius: 50%;
  flex: 0 0 0.45rem;
  height: 0.45rem;
  margin: 0.9rem 0.55rem 0 0;
  width: 0.45rem;
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
.avatar img {
  height: 100%;
  object-fit: cover;
  width: 100%;
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
  bottom: 0;
  display: block;
  left: 0;
  min-height: 0;
  position: absolute;
  right: 0;
  top: 56px;
}
.app-content ion-card {
  --background: #ffffff;
}
.app-content ion-button {
  font-weight: 700;
}
.mobile-tabs {
  align-items: stretch;
  background: white;
  border-top: 1px solid #eadfd8;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  height: calc(4.5rem + env(safe-area-inset-bottom));
  min-height: calc(4.5rem + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  position: fixed;
  width: 100%;
  z-index: 10;
}
.mobile-tabs button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 0.25rem 0.1rem 0.4rem;
  position: relative;
  transform: none !important;
  transition: color 160ms ease;
}
.mobile-tabs button.tab-is-active {
  color: var(--meatup-primary);
  font-weight: 600;
}
.mobile-tabs button ion-icon {
  font-size: 1.25rem;
  height: 1.35rem;
  margin-bottom: 0.2rem;
  transform: none !important;
  width: 1.35rem;
}
.mobile-tabs button ion-label {
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1;
  opacity: 1;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: none !important;
  width: 100%;
}
@media (min-width: 768px) {
  ion-menu-button,
  .mobile-tabs {
    display: none;
  }
}
</style>
