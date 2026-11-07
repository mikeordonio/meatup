<template>
  <ion-page>
    <ion-content class="dashboard-content">
    <div class="page">
    <header class="heading">
      <div>
        <p class="eyebrow">{{ roleLabel }} / {{ sectionLabel }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <ion-button v-if="isOwner && section === 'products'" @click="resetProduct">Add product</ion-button>
    </header>

    <ion-text v-if="errorMessage" color="danger"
      ><p>{{ errorMessage }}</p></ion-text
    >
    <div v-if="loading" class="state"><ion-spinner /></div>

    <template v-else-if="isOwner && section === 'products'">
      <ion-card>
        <ion-card-header
          ><ion-card-title>{{ editingProduct ? 'Edit product' : 'New product' }}</ion-card-title></ion-card-header
        >
        <ion-card-content>
          <div class="form-grid">
            <ion-input v-model="productForm.name" label="Product name" label-placement="stacked" fill="outline" />
            <ion-select v-model="productForm.category" label="Category" label-placement="stacked" fill="outline">
              <ion-select-option value="Pork">Pork</ion-select-option
              ><ion-select-option value="Chicken">Chicken</ion-select-option>
            </ion-select>
            <ion-input
              v-model.number="productForm.pricePerKg"
              type="number"
              label="Price per kg"
              label-placement="stacked"
              fill="outline"
            />
            <ion-input
              v-model.number="productForm.stockKg"
              type="number"
              label="Stock (kg)"
              label-placement="stacked"
              fill="outline"
            />
            <ion-input
              v-model.number="productForm.minStockKg"
              type="number"
              label="Low-stock threshold"
              label-placement="stacked"
              fill="outline"
            />
            <ion-input v-model="productForm.description" label="Description" label-placement="stacked" fill="outline" />
          </div>
          <input type="file" accept="image/*" @change="readImage" />
          <img v-if="productForm.imageData" class="preview" :src="productForm.imageData" alt="Product preview" />
          <div class="actions">
            <ion-button @click="saveProductForm">{{ editingProduct ? 'Save changes' : 'Publish product' }}</ion-button
            ><ion-button v-if="editingProduct" fill="clear" @click="resetProduct">Cancel</ion-button>
          </div>
        </ion-card-content>
      </ion-card>
      <ion-list v-if="products.length">
        <ion-item v-for="product in products" :key="product.id">
          <ion-label
            ><h2>{{ product.name }}</h2>
            <p>
              {{ product.category }} · ₱{{ product.pricePerKg.toFixed(2) }}/kg · {{ product.stockKg }} kg
            </p></ion-label
          >
          <ion-button slot="end" fill="clear" @click="editProduct(product)">Edit</ion-button>
          <ion-button slot="end" fill="clear" color="danger" @click="deleteProduct(product.id)">Delete</ion-button>
        </ion-item>
      </ion-list>
      <p v-else class="state">Create your first product to make it visible to customers after shop approval.</p>
    </template>

    <template v-else-if="isOwner && section === 'inventory'">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Inventory overview</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Monitor stock levels and update quantities without changing your product listings.</p>
        </ion-card-content>
      </ion-card>
      <div v-if="products.length" class="inventory-list">
        <article v-for="product in products" :key="product.id" class="inventory-item">
          <div class="inventory-product">
            <h2>{{ product.name }}</h2>
            <p>{{ product.category }} · Minimum {{ product.minStockKg }} kg</p>
          </div>
          <ion-input
            v-model.number="product.stockKg"
            class="stock-input"
            type="number"
            min="0"
            label="Stock (kg)"
            label-placement="stacked"
            fill="outline"
            @ion-blur="saveInventory(product)"
          />
          <ion-chip :color="product.stockKg <= product.minStockKg ? 'warning' : 'success'">
            {{ product.stockKg <= product.minStockKg ? 'Low stock' : 'In stock' }}
          </ion-chip>
        </article>
      </div>
      <p v-else class="state">Add products first so their inventory can be tracked here.</p>
    </template>

    <template v-else-if="isOwner && section === 'shop'">
      <ion-card
        ><ion-card-header><ion-card-title>Shop profile</ion-card-title></ion-card-header
        ><ion-card-content>
          <div class="form-grid">
            <ion-input v-model="shopForm.name" label="Shop name" label-placement="stacked" fill="outline" />
            <ion-input v-model="shopForm.phone" label="Phone" label-placement="stacked" fill="outline" />
            <ion-input v-model="shopForm.address" label="Address" label-placement="stacked" fill="outline" />
            <ion-input v-model="shopForm.description" label="Description" label-placement="stacked" fill="outline" />
            <ion-toggle v-model="shopForm.isOpen">Open for orders</ion-toggle
            ><ion-toggle v-model="shopForm.deliveryAvailable">Delivery available</ion-toggle>
            <ion-input
              v-model.number="shopForm.deliveryFee"
              type="number"
              label="Delivery fee"
              label-placement="stacked"
              fill="outline"
            />
          </div>
          <input type="file" accept="image/*" @change="readShopImage" />
          <img v-if="shopForm.imageUrl" class="preview" :src="shopForm.imageUrl" alt="Shop preview" />
          <p class="hint">Click the map or use "Use my location" to set the exact shop location.</p>
          <ShopMap selectable :latitude="shopForm.latitude" :longitude="shopForm.longitude" @selected="setLocation" />
          <div class="actions"><ion-button @click="saveShopForm">Submit shop for approval</ion-button></div>
        </ion-card-content></ion-card
      >
    </template>

    <template v-else-if="isAdmin && section === 'users'">
      <ion-searchbar v-model="search" placeholder="Search users" />
      <ion-list
        ><ion-item v-for="user in filteredUsers" :key="user.uid"
          ><ion-label
            ><h2>{{ user.fullName }}</h2>
            <p>{{ user.email }} · {{ user.role }} · {{ user.isActive === false ? 'Deactivated' : 'Active' }}</p></ion-label
          ><ion-chip :color="user.role === 'admin' ? 'danger' : user.role === 'owner' ? 'warning' : 'medium'">{{
            user.role
          }}</ion-chip
          ><ion-button
            v-if="user.role === 'customer'"
            slot="end"
            fill="outline"
            :color="user.isActive === false ? 'success' : 'danger'"
            @click="toggleCustomer(user)"
          >
            {{ user.isActive === false ? 'Activate' : 'Deactivate' }}
          </ion-button></ion-item
        ></ion-list
      >
    </template>

    <template v-else-if="isAdmin && section === 'shops'">
      <ion-list
        ><ion-item v-for="shop in shops" :key="shop.id"
          ><ion-label
            ><h2>{{ shop.name }}</h2>
            <p>
              {{ shop.address }} · {{ shop.isApproved ? 'Approved' : 'Pending approval' }} ·
              {{ shop.isSuspended ? 'Suspended' : 'Active' }}
            </p></ion-label
          ><ion-button v-if="!shop.isApproved" slot="end" @click="approve(shop.id)">Approve</ion-button>
          <ion-button
            v-if="shop.isApproved"
            slot="end"
            fill="outline"
            :color="shop.isSuspended ? 'success' : 'danger'"
            @click="toggleShopSuspension(shop)"
          >
            {{ shop.isSuspended ? 'Unsuspend' : 'Suspend' }}
          </ion-button></ion-item
        ></ion-list
      >
    </template>

      <template v-else-if="isAdmin && section === 'reports'">
        <div class="report-actions">
          <ion-button fill="outline" @click="loadData">Refresh Analytics</ion-button>
          <ion-button @click="downloadExcelReport">Download Excel</ion-button>
          <ion-button @click="downloadPdfReport">Download PDF</ion-button>
        </div>
        <div class="report-grid">
            <ion-card>
            <ion-card-header>
              <ion-card-title>Order Health</ion-card-title>
              <ion-card-subtitle>Current distribution by status</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="donut-layout">
                <div class="donut-chart" :style="statusDonutStyle" role="img" aria-label="Order status donut chart">
                  <strong>{{ report.orders }}</strong>
                  <span>Total orders</span>
                </div>
                <div class="donut-legend">
                  <div v-for="item in statusChart" :key="item.status" class="legend-item">
                    <span class="legend-dot" :style="{ background: item.color }"></span>
                    <span>{{ item.label }}</span>
                    <strong>{{ item.count }}</strong>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Top Performing Shops</ion-card-title>
              <ion-card-subtitle>Ranked by Recognized Revenue</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div v-if="shopChart.length" class="ranking-chart" role="img" aria-label="Top shops revenue chart">
                <div v-for="(shop, index) in shopChart" :key="shop.shopName" class="ranking-row">
                  <span class="ranking-number">{{ index + 1 }}</span>
                  <div class="ranking-content">
                    <div class="ranking-heading"><strong>{{ shop.shopName }}</strong><span>₱{{ shop.revenue.toFixed(2) }}</span></div>
                    <div class="chart-track"><span class="chart-bar chart-bar-accent" :style="{ width: `${shop.width}%` }"></span></div>
                    <small>{{ shop.orders }} order(s)</small>
                  </div>
                </div>
              </div>
              <p v-else class="state">No shop orders yet.</p>
            </ion-card-content>
          </ion-card>
        </div>
      </template>

      <template v-else>
      <div class="stat-grid">
        <ion-card v-for="stat in reportStats" :key="stat.label"
          ><ion-card-content
            ><span>{{ stat.icon }}</span>
            <p>{{ stat.label }}</p>
            <h2>{{ stat.value }}</h2></ion-card-content
          ></ion-card
        >
      </div>
      <ion-card
        ><ion-card-header
          ><ion-card-title>{{ isAdmin ? 'Platform analytics' : 'Shop performance' }}</ion-card-title></ion-card-header
        ><ion-card-content
          ><p>
            Revenue and order totals are calculated from Firestore orders. Cancelled and rejected orders are excluded from revenue.
          </p>
          <ion-button fill="outline" @click="loadData">Refresh analytics</ion-button></ion-card-content
        ></ion-card
      >
    </template>
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
  IonChip,
  IonContent,
  IonInput,
  IonList,
  IonItem,
  IonLabel,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonToggle,
  alertController,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import ShopMap from '@/components/ShopMap.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import type { AdminAnalytics, OrderStatus, Product, Shop, UserProfile } from '@/models';
import {
  getAdminAnalytics,
  getOwnerSummary,
  listAllShops,
  listOwnerProducts,
  listOwnerShops,
  listUsers,
  removeProduct,
  saveProduct as persistProduct,
  saveShop as persistShop,
  setShopApproval,
  setShopSuspended,
  setUserActive,
} from '@/services/management';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
const section = computed(() => {
  if (route.path === '/app/owner/shop') return 'shop';
  if (route.path === '/app/owner/inventory') return 'inventory';
  return String(route.params.section ?? 'reports');
});
const isOwner = computed(() => auth.role === 'owner');
const isAdmin = computed(() => auth.role === 'admin');
const roleLabel = computed(() => (isOwner.value ? 'Shop owner' : 'Administrator'));
const sectionLabel = computed(() => section.value);
const title = computed(() =>
  section.value === 'products'
    ? 'Manage Products'
    : section.value === 'inventory'
      ? 'Manage Inventory'
      : section.value === 'sales'
        ? 'Sales Overview'
    : section.value === 'shop'
      ? 'Set up your meat shop'
      : section.value === 'users'
        ? 'Manage Users'
        : section.value === 'shops'
          ? 'Review Meat Shops'
          : 'Reports and Analytics',
);
const description = computed(() =>
  section.value === 'shop'
    ? 'Publish your shop profile, location, and storefront image.'
    : 'Keep your marketplace data accurate and actionable.',
);
const loading = ref(true);
const errorMessage = ref('');
const search = ref('');
const products = ref<Product[]>([]);
const shops = ref<Shop[]>([]);
const users = ref<UserProfile[]>([]);
const report = ref({ revenue: 0, orders: 0, customers: 0, shops: 0, products: 0 });
const analytics = ref<AdminAnalytics>({
  summary: report.value,
  statusCounts: {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready_for_pickup: 0,
    out_for_delivery: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  },
  shopPerformance: [],
});
const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
  'rejected',
];
const statusChart = computed(() => {
  const max = Math.max(...orderStatuses.map((status) => analytics.value.statusCounts[status]), 1);
  return orderStatuses
    .map((status) => ({
      status,
      label: status.replaceAll('_', ' '),
      count: analytics.value.statusCounts[status],
      color: statusColors[status],
      width: Math.max((analytics.value.statusCounts[status] / max) * 100, analytics.value.statusCounts[status] ? 4 : 0),
    }))
    .filter((item) => item.count > 0);
});
const statusColors: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#2563eb',
  preparing: '#8b5cf6',
  ready_for_pickup: '#06b6d4',
  out_for_delivery: '#14b8a6',
  completed: '#16a34a',
  cancelled: '#ef4444',
  rejected: '#64748b',
};
const statusDonutStyle = computed(() => {
  const total = Math.max(report.value.orders, 1);
  let start = 0;
  const segments = orderStatuses
    .filter((status) => analytics.value.statusCounts[status] > 0)
    .map((status) => {
      const end = start + (analytics.value.statusCounts[status] / total) * 360;
      const segment = `${statusColors[status]} ${start}deg ${end}deg`;
      start = end;
      return segment;
    });
  return { background: `conic-gradient(${segments.join(', ') || '#eadfd8 0deg 360deg'})` };
});
const shopChart = computed(() => {
  const max = Math.max(...analytics.value.shopPerformance.map((shop) => shop.revenue), 1);
  return analytics.value.shopPerformance.map((shop) => ({
    ...shop,
    width: Math.max((shop.revenue / max) * 100, shop.revenue ? 4 : 0),
  }));
});
const ownerLowStock = ref(0);
const editingProduct = ref<string>();
const productForm = reactive<Omit<Product, 'id' | 'createdAt'>>({
  shopId: '',
  name: '',
  category: 'Pork',
  description: '',
  pricePerKg: 0,
  stockKg: 0,
  minStockKg: 1,
  imageUrl: '',
  imageData: '',
  isAvailable: true,
});
const shopForm = reactive<Omit<Shop, 'id' | 'createdAt'>>({
  ownerId: auth.profile?.uid ?? '',
  name: '',
  description: '',
  address: '',
  phone: '',
  isOpen: true,
  isApproved: false,
  deliveryAvailable: false,
  deliveryFee: 0,
  imageUrl: '',
  latitude: 13,
  longitude: 121.4,
});
const filteredUsers = computed(() =>
  users.value.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search.value.toLowerCase())),
);
const reportStats = computed(() =>
  isOwner.value
    ? [
        { label: 'Sales', value: `₱${report.value.revenue.toFixed(2)}`, icon: '₱' },
        { label: 'Pending orders', value: report.value.orders, icon: '🧾' },
        { label: 'Products', value: report.value.products, icon: '🥩' },
        { label: 'Low stock', value: ownerLowStock.value, icon: '📦' },
      ]
    : [
        { label: 'Revenue', value: `₱${report.value.revenue.toFixed(2)}`, icon: '₱' },
        { label: 'Orders', value: report.value.orders, icon: '🧾' },
        { label: 'Customers', value: report.value.customers, icon: '👥' },
        { label: 'Shops', value: report.value.shops, icon: '🏪' },
        { label: 'Products', value: report.value.products, icon: '🥩' },
      ],
);

async function loadData(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (isOwner.value) {
      const ownerShops = await listOwnerShops(auth.profile!.uid);
      shops.value = ownerShops;
      if (ownerShops[0]) Object.assign(shopForm, ownerShops[0]);
      products.value = await listOwnerProducts(auth.profile!.uid);
      productForm.shopId = ownerShops[0]?.id ?? '';
      const ownerSummary = await getOwnerSummary(auth.profile!.uid);
      ownerLowStock.value = ownerSummary.lowStock;
      report.value = {
        revenue: ownerSummary.sales,
        orders: ownerSummary.pendingOrders,
        customers: 0,
        shops: ownerShops.length,
        products: ownerSummary.products,
      };
    }
    if (isAdmin.value) {
      users.value = await listUsers();
      shops.value = await listAllShops();
      analytics.value = await getAdminAnalytics();
      report.value = analytics.value.summary;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load management data.';
  } finally {
    loading.value = false;
  }
}
function reportFileDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function downloadExcelReport(): void {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['MeatUp Macatoc Platform Report'],
      ['Generated at', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Revenue', report.value.revenue],
      ['Orders', report.value.orders],
      ['Customers', report.value.customers],
      ['Shops', report.value.shops],
      ['Products', report.value.products],
    ]),
    'Summary',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['Order status', 'Count'],
      ...orderStatuses.map((status) => [status.replaceAll('_', ' '), analytics.value.statusCounts[status]]),
    ]),
    'Order Status',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['Shop', 'Orders', 'Revenue'],
      ...analytics.value.shopPerformance.map((shop) => [shop.shopName, shop.orders, shop.revenue]),
    ]),
    'Shop Performance',
  );
  XLSX.writeFile(workbook, `meatup-platform-report-${reportFileDate()}.xlsx`);
}
function downloadPdfReport(): void {
  const pdf = new jsPDF();
  pdf.setFillColor(139, 30, 36);
  pdf.rect(0, 0, 210, 34, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text('MeatUp Macatoc', 15, 15);
  pdf.setFontSize(11);
  pdf.text('Platform analytics report', 15, 24);
  pdf.setTextColor(37, 37, 37);
  pdf.setFontSize(10);
  pdf.text(`Generated ${new Date().toLocaleString()}`, 15, 44);
  autoTable(pdf, {
    startY: 52,
    head: [['Metric', 'Value']],
    body: [
      ['Revenue', `PHP ${report.value.revenue.toFixed(2)}`],
      ['Orders', String(report.value.orders)],
      ['Customers', String(report.value.customers)],
      ['Shops', String(report.value.shops)],
      ['Products', String(report.value.products)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [139, 30, 36] },
  });
  autoTable(pdf, {
    startY: (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
      : 120,
    head: [['Order status', 'Count']],
    body: orderStatuses.map((status) => [status.replaceAll('_', ' '), String(analytics.value.statusCounts[status])]),
    theme: 'striped',
    headStyles: { fillColor: [139, 30, 36] },
  });
  const finalY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  autoTable(pdf, {
    startY: finalY + 12,
    head: [['Shop', 'Orders', 'Revenue']],
    body: analytics.value.shopPerformance.map((shop) => [
      shop.shopName,
      String(shop.orders),
      `PHP ${shop.revenue.toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 30, 36] },
  });
  pdf.save(`meatup-platform-report-${reportFileDate()}.pdf`);
}
function resetProduct(): void {
  editingProduct.value = undefined;
  Object.assign(productForm, {
    shopId: shops.value[0]?.id ?? '',
    name: '',
    category: 'Pork',
    description: '',
    pricePerKg: 0,
    stockKg: 0,
    minStockKg: 1,
    imageUrl: '',
    imageData: '',
    isAvailable: true,
  });
}
function editProduct(product: Product): void {
  editingProduct.value = product.id;
  Object.assign(productForm, product);
}
async function saveProductForm(): Promise<void> {
  errorMessage.value = '';
  if (!productForm.shopId) {
    errorMessage.value = 'Complete your shop profile before adding products.';
    return;
  }
  if (!productForm.name.trim()) {
    errorMessage.value = 'Enter a product name.';
    return;
  }
  if (productForm.pricePerKg <= 0) {
    errorMessage.value = 'Enter a price greater than zero.';
    return;
  }
  if (productForm.stockKg < 0 || productForm.minStockKg < 0) {
    errorMessage.value = 'Stock values cannot be negative.';
    return;
  }
  try {
    await persistProduct({ ...productForm, name: productForm.name.trim() }, editingProduct.value);
    await loadData();
    resetProduct();
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? `Unable to save product: ${error.message}`
        : 'Unable to save product. Check your connection and try again.';
  }
}
async function saveInventory(product: Product): Promise<void> {
  if (product.stockKg < 0) {
    product.stockKg = 0;
  }
  try {
    const { id, ...input } = product;
    await persistProduct(input, id);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? `Unable to update inventory: ${error.message}` : 'Unable to update inventory.';
  }
}
async function deleteProduct(id: string): Promise<void> {
  await removeProduct(id);
  await loadData();
}
async function saveShopForm(): Promise<void> {
  await persistShop({ ...shopForm, isApproved: false }, shops.value[0]?.id);
  await loadData();
}
async function approve(id: string): Promise<void> {
  await setShopApproval(id, true);
  await loadData();
}
async function toggleCustomer(user: UserProfile): Promise<void> {
  const nextActive = user.isActive === false;
  const alert = await alertController.create({
    header: nextActive ? 'Activate customer?' : 'Deactivate customer?',
    message: nextActive
      ? `${user.fullName} will be able to sign in again.`
      : `${user.fullName} will be signed out and unable to access the app.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: nextActive ? 'Activate' : 'Deactivate', role: 'confirm' },
    ],
  });
  await alert.present();
  if ((await alert.onDidDismiss()).role !== 'confirm') return;
  await setUserActive(user.uid, nextActive);
  user.isActive = nextActive;
}
async function toggleShopSuspension(shop: Shop): Promise<void> {
  const nextSuspended = !shop.isSuspended;
  const alert = await alertController.create({
    header: nextSuspended ? 'Suspend shop?' : 'Unsuspend shop?',
    message: nextSuspended
      ? `${shop.name} will be hidden from customers and unavailable for new orders.`
      : `${shop.name} will be visible to customers again.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: nextSuspended ? 'Suspend' : 'Unsuspend', role: 'confirm' },
    ],
  });
  await alert.present();
  if ((await alert.onDidDismiss()).role !== 'confirm') return;
  await setShopSuspended(shop.id, nextSuspended);
  shop.isSuspended = nextSuspended;
}
function setLocation(latitude: number, longitude: number): void {
  shopForm.latitude = latitude;
  shopForm.longitude = longitude;
}
function readImage(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file)
    compressImage(file, (data) => {
      productForm.imageData = data;
      productForm.imageUrl = data;
    });
}
function readShopImage(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file)
    compressImage(file, (data) => {
      shopForm.imageUrl = data;
    });
}
function compressImage(file: File, done: (data: string) => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(800 / image.width, 1);
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}
onIonViewWillEnter(loadData);
</script>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem 6rem;
}
.stock-input {
  flex: 0 0 110px;
  margin-right: 0.75rem;
}
.inventory-list { display: grid; gap: 0.65rem; }
.inventory-item {
  align-items: center;
  background: white;
  border-radius: 12px;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.8rem 1rem;
}
.inventory-product { flex: 1 1 auto; min-width: 0; }
.inventory-product h2, .inventory-product p { margin: 0; }
.inventory-product h2 { font-size: 1rem; }
.inventory-product p { color: var(--meatup-muted); font-size: 0.8rem; margin-top: 0.25rem; }
.inventory-item .stock-input { flex: 0 0 110px; margin: 0; }
.inventory-item ion-chip { flex: 0 0 auto; margin: 0; }
.dashboard-content {
  --background: var(--meatup-background);
}
.heading {
  align-items: end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.heading h1 {
  margin: 0;
  color: var(--meatup-text);
}
.heading p:last-child,
.hint {
  color: var(--meatup-muted);
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.form-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  margin-bottom: 1rem;
}
ion-card {
  border-radius: 16px;
}
.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
.report-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.report-grid ion-card {
  margin: 0;
}
.chart {
  display: grid;
  gap: 0.9rem;
}
.donut-layout {
  align-items: center;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(150px, 0.8fr) 1fr;
}
.donut-chart {
  align-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 190px;
  position: relative;
  width: 100%;
}
.donut-chart::after {
  background: white;
  border-radius: 50%;
  content: '';
  inset: 14%;
  position: absolute;
}
.donut-chart strong,
.donut-chart span {
  position: relative;
  z-index: 1;
}
.donut-chart strong {
  color: var(--meatup-text);
  font-size: 1.5rem;
}
.donut-chart span {
  color: var(--meatup-muted);
  font-size: 0.68rem;
}
.donut-legend {
  display: grid;
  gap: 0.7rem;
}
.legend-item {
  align-items: center;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: auto 1fr auto;
  font-size: 0.78rem;
  text-transform: capitalize;
}
.legend-dot {
  border-radius: 50%;
  height: 0.6rem;
  width: 0.6rem;
}
.ranking-chart {
  display: grid;
  gap: 1.1rem;
}
.ranking-row {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
}
.ranking-number {
  align-items: center;
  background: #fff3e5;
  border-radius: 50%;
  color: var(--meatup-primary);
  display: flex;
  flex: 0 0 1.7rem;
  font-weight: 800;
  height: 1.7rem;
  justify-content: center;
}
.ranking-content {
  flex: 1;
}
.ranking-heading {
  display: flex;
  font-size: 0.8rem;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.ranking-heading span,
.ranking-content small {
  color: var(--meatup-muted);
}
.ranking-content small {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.3rem;
}
.chart-row {
  align-items: center;
  display: grid;
  gap: 0.6rem;
  grid-template-columns: minmax(90px, 1fr) 2fr 42px;
}
.chart-label {
  color: var(--meatup-muted);
  font-size: 0.78rem;
  text-transform: capitalize;
}
.chart-track {
  background: #f1e7e1;
  border-radius: 999px;
  height: 0.7rem;
  overflow: hidden;
}
.chart-bar {
  background: var(--meatup-primary);
  border-radius: inherit;
  display: block;
  height: 100%;
  transition: width 0.3s ease;
}
.chart-bar-accent {
  background: var(--meatup-accent);
}
.chart-row strong {
  font-size: 0.78rem;
  text-align: right;
}
@media (max-width: 600px) {
  .donut-layout {
    grid-template-columns: 1fr;
  }
  .donut-chart {
    max-width: 160px;
  }
}
.preview {
  border-radius: 10px;
  max-height: 160px;
  max-width: 240px;
  object-fit: cover;
}
.state {
  color: var(--meatup-muted);
  padding: 3rem;
  text-align: center;
}
.stat-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin-bottom: 1.25rem;
}
.stat-grid ion-card {
  margin: 0;
}
.stat-grid span {
  font-size: 1.5rem;
}
.stat-grid p {
  color: var(--meatup-muted);
  margin-bottom: 0.3rem;
}
.stat-grid h2 {
  margin: 0;
}
@media (max-width: 600px) {
  .heading {
    align-items: start;
    flex-direction: column;
  }
  .inventory-item { align-items: stretch; flex-wrap: wrap; gap: 0.65rem; padding: 0.85rem; }
  .inventory-product { flex: 1 1 100%; }
  .inventory-item .stock-input { flex: 1 1 120px; }
  .inventory-item ion-chip { align-self: center; }
}
</style>
