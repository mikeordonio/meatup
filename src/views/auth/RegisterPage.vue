<template>
  <AuthLayout>
    <form class="auth-form" @submit.prevent="submit">
      <div class="form-heading">
        <p class="eyebrow">JOIN MEATUP</p>
        <h2>Create your account</h2>
        <p>Start ordering fresh meat from local shops.</p>
      </div>
      <ion-text v-if="errorMessage" color="danger"
        ><p class="message">{{ errorMessage }}</p></ion-text
      >
      <ion-item
        ><ion-input v-model="fullName" label="Full name" label-placement="stacked" autocomplete="name" required
      /></ion-item>
      <ion-item
        ><ion-input
          v-model="email"
          label="Email address"
          label-placement="stacked"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
      /></ion-item>
      <ion-item
        ><ion-input
          v-model="phone"
          label="Phone number"
          label-placement="stacked"
          type="tel"
          autocomplete="tel"
          inputmode="tel"
          required
      /></ion-item>
      <ion-item>
        <ion-select v-model="role" label="Account type" label-placement="stacked" interface="popover">
          <ion-select-option value="customer">Customer</ion-select-option>
          <ion-select-option value="owner">Shop owner</ion-select-option>
        </ion-select>
      </ion-item>
      <p class="field-hint">
        Choose Customer to order from shops, or Shop owner to register and manage your meat shop.
      </p>
      <ion-item
        ><ion-input
          v-model="password"
          label="Password"
          label-placement="stacked"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :minlength="6"
          required
      /></ion-item>
      <ion-item
        ><ion-input
          v-model="confirmPassword"
          label="Confirm password"
          label-placement="stacked"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          required
      /></ion-item>
      <ion-button fill="clear" size="small" class="password-toggle" @click="showPassword = !showPassword">
        {{ showPassword ? 'Hide passwords' : 'Show passwords' }}
      </ion-button>
      <ion-button expand="block" type="submit" :disabled="loading">{{
        loading ? 'Creating account...' : 'Create account'
      }}</ion-button>
      <p class="switch-copy">Already have an account? <router-link to="/login">Sign in</router-link></p>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { FirebaseError } from 'firebase/app';
import { IonButton, IonInput, IonItem, IonSelect, IonSelectOption, IonText } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import AuthLayout from './AuthLayout.vue';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/models';

const router = useRouter();
const authStore = useAuthStore();
const fullName = ref('');
const email = ref('');
const phone = ref('');
const role = ref<Exclude<UserRole, 'admin'>>('customer');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

async function submit(): Promise<void> {
  errorMessage.value = '';
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }
  loading.value = true;
  try {
    await authStore.register({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      password: password.value,
      role: role.value,
    });
    await router.replace('/app');
  } catch (error) {
    errorMessage.value =
      error instanceof FirebaseError && error.code === 'auth/email-already-in-use'
        ? 'An account already exists for this email.'
        : 'Unable to create your account. Please check your details.';
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
  margin-bottom: 1.5rem;
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
  --color: #252525;
  --highlight-color-focused: var(--meatup-primary);
  margin-bottom: 0.45rem;
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
  color: #252525;
}
.message {
  background: #fff1f0;
  border-radius: 10px;
  color: #a52b2e;
  font-size: 0.85rem;
  margin: 0 0 1rem;
  padding: 0.75rem;
}
.field-hint {
  color: var(--meatup-muted);
  font-size: 0.78rem;
  margin: -0.1rem 0 1rem;
}
.password-toggle {
  margin: -0.25rem 0 0.75rem;
}
.switch-copy {
  font-size: 0.9rem;
  margin-top: 1.5rem;
  text-align: center;
}
</style>
