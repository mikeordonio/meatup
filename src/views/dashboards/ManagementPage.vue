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
          <p class="hint">Click the map to set the exact shop location.</p>
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
            <p>{{ user.email }} · {{ user.role }}</p></ion-label
          ><ion-chip :color="user.role === 'admin' ? 'danger' : user.role === 'owner' ? 'warning' : 'medium'">{{
            user.role
          }}</ion-chip></ion-item
        ></ion-list
      >
    </template>

    <template v-else-if="isAdmin && section === 'shops'">
      <ion-list
        ><ion-item v-for="shop in shops" :key="shop.id"
          ><ion-label
            ><h2>{{ shop.name }}</h2>
            <p>{{ shop.address }} · {{ shop.isApproved ? 'Approved' : 'Pending approval' }}</p></ion-label
          ><ion-button v-if="!shop.isApproved" slot="end" @click="approve(shop.id)">Approve</ion-button></ion-item
        ></ion-list
      >
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
            Revenue and order totals are calculated from Firestore orders. Cancelled orders are excluded from revenue.
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
} from '@ionic/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import ShopMap from '@/components/ShopMap.vue';
import type { Product, Shop, UserProfile } from '@/models';
import {
  getReportSummary,
  listAllShops,
  listOwnerProducts,
  listOwnerShops,
  listUsers,
  removeProduct,
  saveProduct as persistProduct,
  saveShop as persistShop,
  setShopApproval,
} from '@/services/management';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
const section = computed(() => String(route.params.section ?? (route.path.includes('/owner') ? 'shop' : 'reports')));
const isOwner = computed(() => auth.role === 'owner');
const isAdmin = computed(() => auth.role === 'admin');
const roleLabel = computed(() => (isOwner.value ? 'Shop owner' : 'Administrator'));
const sectionLabel = computed(() => section.value);
const title = computed(() =>
  section.value === 'products'
    ? 'Manage products'
    : section.value === 'shop'
      ? 'Set up your meat shop'
      : section.value === 'users'
        ? 'Manage users'
        : section.value === 'shops'
          ? 'Review meat shops'
          : 'Reports and analytics',
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
const reportStats = computed(() => [
  { label: 'Revenue', value: `₱${report.value.revenue.toFixed(2)}`, icon: '₱' },
  { label: 'Orders', value: report.value.orders, icon: '🧾' },
  { label: 'Customers', value: report.value.customers, icon: '👥' },
  { label: 'Shops', value: report.value.shops, icon: '🏪' },
  { label: 'Products', value: report.value.products, icon: '🥩' },
]);

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
    }
    if (isAdmin.value) {
      users.value = await listUsers();
      shops.value = await listAllShops();
      report.value = await getReportSummary();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load management data.';
  } finally {
    loading.value = false;
  }
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
onMounted(loadData);
</script>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem 6rem;
}
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
}
</style>
