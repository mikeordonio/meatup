import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import AppShell from '@/views/AppShell.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import CartPage from '@/views/customer/CartPage.vue';
import CheckoutPage from '@/views/customer/CheckoutPage.vue';
import ShopDetailsPage from '@/views/customer/ShopDetailsPage.vue';
import ShopListPage from '@/views/customer/ShopListPage.vue';
import CustomerHomePage from '@/views/dashboards/CustomerHomePage.vue';
import ManagementPage from '@/views/dashboards/ManagementPage.vue';
import OrdersPage from '@/views/dashboards/OrdersPage.vue';
import RoleDashboardPage from '@/views/dashboards/RoleDashboardPage.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/app' },
  { path: '/login', component: () => import('@/views/auth/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/register', component: () => import('@/views/auth/RegisterPage.vue'), meta: { guestOnly: true } },
  {
    path: '/forgot-password',
    component: () => import('@/views/auth/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/app',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: CustomerHomePage, meta: { roles: ['customer'] } },
      { path: 'owner', component: RoleDashboardPage, meta: { roles: ['owner'] } },
      { path: 'admin', component: RoleDashboardPage, meta: { roles: ['admin'] } },
      { path: 'shops', component: ShopListPage, meta: { roles: ['customer'] } },
      { path: 'shops/:shopId', component: ShopDetailsPage, meta: { roles: ['customer'] } },
      { path: 'cart', component: CartPage, meta: { roles: ['customer'] } },
      { path: 'checkout', component: CheckoutPage, meta: { roles: ['customer'] } },
      { path: 'orders', component: OrdersPage, meta: { roles: ['customer'] } },
      { path: 'orders/:orderId', component: OrdersPage, meta: { roles: ['customer'] } },
      { path: 'profile', component: ProfilePage, meta: { roles: ['customer', 'owner', 'admin'] } },
      { path: 'owner/shop', component: ManagementPage, meta: { roles: ['owner'] } },
      { path: 'owner/:section(products|sales)', component: ManagementPage, meta: { roles: ['owner'] } },
      { path: 'owner/orders', component: OrdersPage, meta: { roles: ['owner'] } },
      { path: 'owner/inventory', component: ManagementPage, meta: { roles: ['owner'] } },
      { path: 'admin/:section(users|shops|reports)', component: ManagementPage, meta: { roles: ['admin'] } },
      { path: 'admin/orders', component: OrdersPage, meta: { roles: ['admin'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/app' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.ready;

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return '/app';
  }
  const roles = to.meta.roles as string[] | undefined;
  if (roles && (!authStore.role || !roles.includes(authStore.role))) {
    return authStore.role === 'owner' ? '/app/owner' : authStore.role === 'admin' ? '/app/admin' : '/app';
  }
  return true;
});

export default router;
