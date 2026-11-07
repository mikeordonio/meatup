<template>
  <ion-page>
    <ion-content>
      <div class="page-container">
        <div class="page-heading">
          <p class="eyebrow">ACCOUNT</p>
          <h1>My profile</h1>
          <p>Keep your account details and delivery address up to date.</p>
        </div>
        <ion-text v-if="message" color="success"><p>{{ message }}</p></ion-text>
        <ion-text v-if="errorMessage" color="danger"><p>{{ errorMessage }}</p></ion-text>
        <ion-card>
          <ion-card-content>
            <div class="profile-header">
              <div class="avatar">
                <img v-if="profileImage" :src="profileImage" alt="Profile picture" />
                <span v-else>{{ initials }}</span>
              </div>
              <div>
                <h2>{{ auth.profile?.fullName }}</h2>
                <p>{{ roleLabel }}</p>
                <label class="upload-button">
                  Change profile picture
                  <input type="file" accept="image/*" @change="readImage" />
                </label>
              </div>
            </div>
            <ion-list lines="none">
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input :value="auth.profile?.email" readonly />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Phone</ion-label>
                <ion-input :value="auth.profile?.phone || 'Not provided'" readonly />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Address</ion-label>
                <ion-textarea
                  v-model="address"
                  :placeholder="isCustomer ? 'Enter your complete home delivery address' : 'Enter your address'"
                  :rows="4"
                />
              </ion-item>
            </ion-list>
            <p v-if="isCustomer" class="hint">This address will be pre-filled when you choose home delivery at checkout.</p>
            <ion-button expand="block" :disabled="saving" @click="save">
              {{ saving ? 'Saving...' : 'Save profile' }}
            </ion-button>
          </ion-card-content>
        </ion-card>
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTextarea,
} from '@ionic/vue';
import { computed, ref } from 'vue';

import { saveUserProfile } from '@/services/profiles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const address = ref(auth.profile?.defaultAddress ?? '');
const profileImage = ref(auth.profile?.profileImage ?? '');
const saving = ref(false);
const message = ref('');
const errorMessage = ref('');
const isCustomer = computed(() => auth.role === 'customer');
const roleLabel = computed(() => (auth.role === 'owner' ? 'Shop owner' : auth.role === 'admin' ? 'Administrator' : 'Customer'));
const initials = computed(() =>
  (auth.profile?.fullName ?? 'User')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
);

function readImage(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(500 / image.width, 500 / image.height, 1);
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      profileImage.value = canvas.toDataURL('image/jpeg', 0.8);
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

async function save(): Promise<void> {
  if (!auth.profile) return;
  saving.value = true;
  message.value = '';
  errorMessage.value = '';
  try {
    await saveUserProfile(auth.profile.uid, { defaultAddress: address.value.trim(), profileImage: profileImage.value });
    auth.profile.defaultAddress = address.value.trim();
    auth.profile.profileImage = profileImage.value;
    message.value = 'Profile saved successfully.';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save your profile.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page-container { margin: 0 auto; max-width: 760px; padding: 1.5rem 1rem 5rem; }
.page-heading { margin-bottom: 1.25rem; }
.eyebrow { color: var(--meatup-primary); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em; }
h1 { margin: 0; }
.page-heading p:last-child, .hint { color: var(--meatup-muted); }
ion-card { border-radius: 18px; margin: 0; }
.profile-header { align-items: center; display: flex; gap: 1rem; margin-bottom: 1rem; }
.profile-header h2 { margin: 0 0 0.25rem; }
.profile-header p { color: var(--meatup-muted); margin: 0 0 0.5rem; }
.avatar { align-items: center; background: #f5b773; border-radius: 50%; color: var(--meatup-primary); display: flex; flex: 0 0 84px; font-size: 1.5rem; font-weight: 800; height: 84px; justify-content: center; overflow: hidden; }
.avatar img { height: 100%; object-fit: cover; width: 100%; }
.upload-button { color: var(--meatup-primary); cursor: pointer; font-size: 0.8rem; font-weight: 700; }
.upload-button input { display: none; }
ion-item { --padding-start: 0; }
.hint { font-size: 0.82rem; }
</style>
