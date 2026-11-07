<template>
  <AuthLayout>
    <form class="auth-form" @submit.prevent="submit">
      <div class="form-heading">
        <p class="eyebrow">WELCOME BACK</p>
        <h2>Sign in to MeatUp</h2>
        <p>Manage your orders and get fresh cuts delivered.</p>
      </div>
      <ion-text v-if="errorMessage" color="danger"
        ><p class="message">{{ errorMessage }}</p></ion-text
      >
      <ion-item>
        <ion-input
          v-model="email"
          label="Email address"
          label-placement="stacked"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        />
      </ion-item>
      <ion-item>
        <ion-input
          v-model="password"
          label="Password"
          label-placement="stacked"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          required
        />
        <ion-button
          slot="end"
          fill="clear"
          size="small"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Hide' : 'Show' }}
        </ion-button>
      </ion-item>
      <div class="form-actions">
        <ion-button fill="clear" size="small" @click="router.push('/forgot-password')">Forgot password?</ion-button>
      </div>
      <ion-button expand="block" type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </ion-button>
      <p class="switch-copy">New to MeatUp? <router-link to="/register">Create an account</router-link></p>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { FirebaseError } from 'firebase/app';
import { IonButton, IonInput, IonItem, IonText } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import AuthLayout from './AuthLayout.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

async function submit(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(email.value.trim(), password.value);
    const destination = authStore.role === 'owner' ? '/app/owner' : authStore.role === 'admin' ? '/app/admin' : '/app';
    await router.replace(destination);
  } catch (error) {
    errorMessage.value =
      error instanceof FirebaseError && error.code === 'auth/invalid-credential'
        ? 'The email or password is incorrect.'
        : error instanceof Error && error.message === 'This account has been deactivated.'
          ? error.message
        : 'Unable to sign in. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-form {
  background: white;
  border: 1px solid #f0e2d9;
  border-radius: 22px;
  box-shadow: 0 18px 45px #43110d12;
  max-width: 430px;
  padding: clamp(1.25rem, 4vw, 2.25rem);
  width: 100%;
}

.form-heading {
  margin-bottom: 2rem;
}

.eyebrow {
  color: var(--meatup-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h2 {
  color: var(--meatup-text);
  font-size: 2rem;
  margin: 0.6rem 0;
}

.form-heading p:last-child,
.switch-copy {
  color: var(--meatup-muted);
}

ion-item {
  --background: transparent;
  --border-color: #e4d8d0;
  --color: #000;
  margin-bottom: 0.75rem;
}

ion-input {
  --color: #252525;
  --label-color: #252525;
  --highlight-color-focused: var(--meatup-primary);
}

.auth-form ion-input::part(label),
.auth-form ion-select::part(label) {
  color: #252525;
  font-size: 0.86rem;
  font-weight: 700;
  opacity: 1;
}

.auth-form ion-input::part(native),
.auth-form ion-select::part(container) {
  color: #000;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.message {
  background: #fff1f0;
  border-radius: 10px;
  color: #a52b2e;
  font-size: 0.85rem;
  margin: 0 0 1rem;
  padding: 0.75rem;
}

.switch-copy {
  font-size: 0.9rem;
  margin-top: 1.5rem;
  text-align: center;
}
</style>
