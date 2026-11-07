import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase';

export async function saveUserProfile(
  uid: string,
  input: { defaultAddress: string; profileImage?: string },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), input);
}
