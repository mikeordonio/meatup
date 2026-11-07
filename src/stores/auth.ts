import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { auth, db } from '@/firebase';
import type { UserProfile, UserRole } from '@/models';

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null);
  const loading = ref(true);
  const initialized = ref(false);
  let resolveReady: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  let unsubscribe: (() => void) | undefined;

  const isAuthenticated = computed(() => profile.value !== null);
  const role = computed(() => profile.value?.role ?? null);

  async function loadProfile(uid: string): Promise<void> {
    const snapshot = await getDoc(doc(db, 'users', uid));
    profile.value = snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  }

  function initialize(): void {
    if (initialized.value) {
      return;
    }

    initialized.value = true;
    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      loading.value = true;
      try {
        if (firebaseUser) {
          await loadProfile(firebaseUser.uid);
        } else {
          profile.value = null;
        }
      } finally {
        loading.value = false;
        resolveReady?.();
      }
    });
  }

  async function login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: Exclude<UserRole, 'admin'>;
  }): Promise<void> {
    const credentials = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateProfile(credentials.user, { displayName: input.fullName });
    const userProfile: UserProfile = {
      uid: credentials.user.uid,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      defaultAddress: '',
    };
    await setDoc(doc(db, 'users', credentials.user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
    });
    profile.value = userProfile;
  }

  async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async function logout(): Promise<void> {
    await signOut(auth);
  }

  function dispose(): void {
    unsubscribe?.();
  }

  return {
    profile,
    loading,
    isAuthenticated,
    role,
    initialize,
    ready,
    login,
    register,
    resetPassword,
    logout,
    dispose,
  };
});
