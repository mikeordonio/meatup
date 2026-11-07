import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase';
import type { ChatConversation, ChatMessage, ChatParticipant, UserProfile } from '@/models';

function conversationId(left: string, right: string): string {
  return [left, right].sort().join('__');
}

function participant(profile: UserProfile): ChatParticipant {
  return {
    uid: profile.uid,
    fullName: profile.fullName,
    role: profile.role,
    profileImage: profile.profileImage,
    defaultAddress: profile.defaultAddress,
  };
}

export async function getUserProfile(uid: string): Promise<ChatParticipant | undefined> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? participant(snapshot.data() as UserProfile) : undefined;
}

export async function ensureConversation(
  currentUser: ChatParticipant,
  otherUser: ChatParticipant,
): Promise<ChatConversation> {
  const id = conversationId(currentUser.uid, otherUser.uid);
  const reference = doc(db, 'conversations', id);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    await setDoc(reference, {
      participantIds: [currentUser.uid, otherUser.uid],
      participants: [currentUser, otherUser],
      unreadFor: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id, participantIds: [currentUser.uid, otherUser.uid], participants: [currentUser, otherUser], unreadCount: 0 };
  }
  return { id, ...(snapshot.data() as Omit<ChatConversation, 'id' | 'unreadCount'>), unreadCount: 0 };
}

export async function listConversations(uid: string): Promise<ChatConversation[]> {
  const snapshot = await getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid)));
  return snapshot.docs
    .map((entry) => {
      const data = entry.data() as Omit<ChatConversation, 'id' | 'unreadCount'> & { unreadFor?: Record<string, number> };
      return { id: entry.id, ...data, unreadCount: data.unreadFor?.[uid] ?? 0 };
    })
    .sort((left, right) => (right.updatedAt?.toMillis() ?? 0) - (left.updatedAt?.toMillis() ?? 0));
}

export function watchMessages(
  conversationIdValue: string,
  onChange: (messages: ChatMessage[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'conversations', conversationIdValue, 'messages'), orderBy('createdAt', 'asc'), limit(100)),
    (snapshot) =>
      onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as ChatMessage)),
  );
}

export async function sendMessage(conversationIdValue: string, senderId: string, text: string): Promise<void> {
  const reference = doc(db, 'conversations', conversationIdValue);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error('This conversation is no longer available.');
  const data = snapshot.data() as ChatConversation & { unreadFor?: Record<string, number> };
  const unreadFor = { ...(data.unreadFor ?? {}) };
  data.participantIds.filter((uid) => uid !== senderId).forEach((uid) => {
    unreadFor[uid] = (unreadFor[uid] ?? 0) + 1;
  });
  await addDoc(collection(reference, 'messages'), { senderId, text, createdAt: serverTimestamp() });
  await updateDoc(reference, { lastMessage: text, updatedAt: serverTimestamp(), unreadFor });
}

export async function markConversationRead(conversationIdValue: string, uid: string): Promise<void> {
  const reference = doc(db, 'conversations', conversationIdValue);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) return;
  const data = snapshot.data() as { unreadFor?: Record<string, number> };
  await updateDoc(reference, { unreadFor: { ...(data.unreadFor ?? {}), [uid]: 0 } });
}
