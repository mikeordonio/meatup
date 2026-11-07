<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-grid">
        <section class="auth-hero">
          <AppLogo />
          <div class="hero-copy">
            <p class="eyebrow">LOCAL MEAT MARKETPLACE</p>
            <h1>Fresh cuts.<br /><span>Right when you need them.</span></h1>
            <p>Order quality pork and chicken from trusted local shops in a few simple taps.</p>
          </div>
          <div class="hero-detail">Where Pork and Chicken Meet Convenience</div>
        </section>
        <section class="auth-panel">
          <slot />
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';

import AppLogo from '@/components/AppLogo.vue';
</script>

<style scoped>
.auth-content {
  --background: var(--meatup-cream);
}

.auth-grid {
  display: grid;
  min-height: 100%;
}

.auth-hero {
  background: linear-gradient(145deg, #7d171d, #a52b2e);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
}

.auth-hero :deep(.brand-image) {
  background: white;
  border-radius: 12px;
  height: 112px;
  object-position: center;
  padding: 0.35rem;
  width: 210px;
}

.hero-copy {
  max-width: 470px;
}

.eyebrow {
  color: #ffc98c;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  line-height: 1.05;
  margin: 1rem 0;
}

h1 span {
  color: #ffc98c;
}

.hero-copy > p:last-child {
  color: #f7d8cc;
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 380px;
}

.hero-detail {
  color: #f7d8cc;
  font-size: 0.8rem;
}

.auth-panel {
  align-items: center;
  background: var(--meatup-background);
  display: flex;
  justify-content: center;
  padding: 2rem 1.25rem;
}

@media (min-width: 768px) {
  .auth-grid {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 0.75fr);
  }

  .auth-hero {
    padding: 3.5rem;
  }

  .auth-panel {
    padding: 3.5rem;
  }
}
</style>
