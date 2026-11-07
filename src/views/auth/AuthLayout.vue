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

.auth-hero :deep(.brand) {
  animation: logo-arrive 700ms ease-out both;
  justify-content: center;
  width: 100%;
}

.auth-hero :deep(.brand-image) {
  animation: logo-float 4s ease-in-out 900ms infinite;
  background: white;
  border: 5px solid #ffc98c;
  border-radius: 50%;
  box-shadow: 0 12px 28px #43110d33;
  height: 150px;
  object-position: center;
  padding: 0.7rem;
  transform-origin: center;
  width: 150px;
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

@keyframes logo-arrive {
  from {
    opacity: 0;
    transform: scale(0.65) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-hero :deep(.brand),
  .auth-hero :deep(.brand-image) {
    animation: none;
  }
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
