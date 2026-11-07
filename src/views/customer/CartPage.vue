<template>
  <ion-page>
    <ion-header
      ><ion-toolbar><ion-title>Your cart</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <div class="page-container">
        <div class="page-heading">
          <p class="eyebrow">READY TO ORDER?</p>
          <h1>Your cart</h1>
        </div>
        <div v-if="cart.items.length">
          <ion-card class="cart-card"
            ><ion-list>
              <ion-item v-for="item in cart.items" :key="item.product.id">
                <div slot="start" class="item-image">{{ item.product.category === 'Pork' ? '🥩' : '🍗' }}</div>
                <ion-label
                  ><h2>{{ item.product.name }}</h2>
                  <p>₱{{ item.product.pricePerKg.toFixed(2) }}/kg</p></ion-label
                >
                <div class="quantity">
                  <ion-button fill="clear" @click="cart.decrease(item.product.id)">−</ion-button
                  ><strong>{{ item.quantityKg.toFixed(2) }} kg</strong
                  ><ion-button fill="clear" @click="cart.increase(item.product.id)">+</ion-button>
                </div>
                <strong class="line-total">₱{{ (item.product.pricePerKg * item.quantityKg).toFixed(2) }}</strong>
              </ion-item>
            </ion-list></ion-card
          >
          <ion-card class="summary"
            ><ion-card-content
              ><div>
                <span>Subtotal</span><strong>₱{{ cart.subtotal.toFixed(2) }}</strong>
              </div>
              <p>Delivery fees are calculated at checkout.</p>
              <ion-button expand="block" router-link="/app/checkout">Continue to checkout</ion-button
              ><ion-button expand="block" fill="clear" @click="cart.clear">Clear cart</ion-button></ion-card-content
            ></ion-card
          >
        </div>
        <div v-else class="empty-state">
          <ion-icon :icon="cartOutline" />
          <h2>Your cart is empty</h2>
          <p>Browse local shops and add fresh cuts to your order.</p>
          <ion-button router-link="/app/shops">Browse shops</ion-button>
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
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { cartOutline } from 'ionicons/icons';

import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
</script>

<style scoped>
.page-container {
  margin: 0 auto;
  max-width: 900px;
  padding: 1.5rem 1rem 5rem;
}
.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
h1 {
  margin-top: 0;
}
.cart-card,
.summary {
  border-radius: 16px;
  margin: 0 0 1rem;
}
.item-image {
  align-items: center;
  background: #fae7d0;
  border-radius: 10px;
  display: flex;
  font-size: 1.8rem;
  height: 48px;
  justify-content: center;
  width: 48px;
}
.quantity {
  align-items: center;
  display: flex;
}
.quantity ion-button {
  font-size: 1.1rem;
}
.line-total {
  margin-left: 0.75rem;
  min-width: 75px;
  text-align: right;
}
.summary div {
  display: flex;
  font-size: 1.15rem;
  justify-content: space-between;
}
.summary p {
  color: var(--meatup-muted);
  font-size: 0.8rem;
}
.empty-state {
  align-items: center;
  color: var(--meatup-muted);
  display: flex;
  flex-direction: column;
  padding: 4rem 1rem;
  text-align: center;
}
.empty-state ion-icon {
  color: var(--meatup-primary);
  font-size: 3rem;
}
@media (max-width: 600px) {
  .line-total {
    display: none;
  }
  .quantity {
    margin-left: auto;
  }
}
</style>
