<template>
  <AuthLayout>
    <form class="auth-form" @submit.prevent="submit">
      <div class="form-heading">
        <p class="eyebrow">ACCOUNT RECOVERY</p>
        <h2>Reset your password</h2>
        <p>We’ll send a reset link to your email address.</p>
      </div>
      <ion-text v-if="message" color="success"
        ><p class="message success">{{ message }}</p></ion-text
      >
      <ion-text v-if="errorMessage" color="danger"
        ><p class="message">{{ errorMessage }}</p></ion-text
      >
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
      <ion-button expand="block" type="submit" :disabled="loading">{{
        loading ? 'Sending...' : 'Send reset link'
      }}</ion-button>
      <p class="switch-copy"><router-link to="/login">Back to sign in</router-link></p>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { IonButton, IonInput, IonItem, IonText } from '@ionic/vue';
import { ref } from 'vue';
import AuthLayout from './AuthLayout.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const email = ref('');
const loading = ref(false);
const message = ref('');
const errorMessage = ref('');

async function submit(): Promise<void> {
  loading.value = true;
  message.value = '';
  errorMessage.value = '';
  try {
    await authStore.resetPassword(email.value.trim());
    message.value = 'Check your inbox for the password reset link.';
  } catch {
    errorMessage.value = 'Unable to send the reset link. Check the email and try again.';
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
.message {
  border-radius: 10px;
  font-size: 0.85rem;
  margin: 0 0 1rem;
  padding: 0.75rem;
}
.message:not(.success) {
  background: #fff1f0;
  color: #a52b2e;
}
.message.success {
  background: #edf9f0;
  color: #24733a;
}
ion-item {
  --background: transparent;
  --border-color: #e4d8d0;
  --color: #252525;
  --highlight-color-focused: var(--meatup-primary);
  margin-bottom: 1rem;
}
.auth-form ion-input::part(label) {
  color: #252525;
  font-size: 0.86rem;
  font-weight: 700;
  opacity: 1;
}
.auth-form ion-input::part(native) {
  color: #000;
}
.switch-copy {
  font-size: 0.9rem;
  margin-top: 1.5rem;
  text-align: center;
}
</style>
