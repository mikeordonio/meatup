<template>
  <div class="chat-widget">
    <button class="chat-fab" type="button" aria-label="Open chats" @click="toggleOpen">
      💬<span v-if="unreadCount" class="chat-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>
    <section v-if="open" class="chat-panel" aria-label="Chats">
      <header class="chat-header">
        <button v-if="activeConversation" type="button" @click="closeConversation">‹</button>
        <strong>{{ activeConversation ? otherParticipant?.fullName : 'Chats' }}</strong>
        <button type="button" @click="open = false">×</button>
      </header>
      <div v-if="activeConversation" class="chat-body">
        <div class="profile-strip">
          <div class="chat-avatar"><img v-if="otherParticipant?.profileImage" :src="otherParticipant.profileImage" alt="" /><span v-else>{{ initials(otherParticipant) }}</span></div>
          <div><strong>{{ otherParticipant?.fullName }}</strong><button type="button" @click="showProfile = !showProfile">{{ showProfile ? 'Hide profile' : 'View profile' }}</button></div>
        </div>
        <div v-if="showProfile" class="profile-card">
          <p><strong>Role:</strong> {{ otherParticipant?.role }}</p>
          <p v-if="otherParticipant?.defaultAddress"><strong>Address:</strong> {{ otherParticipant.defaultAddress }}</p>
        </div>
        <div ref="messageList" class="messages">
          <p v-if="!messages.length" class="empty-chat">Start the conversation.</p>
          <div v-for="message in messages" :key="message.id" class="message" :class="{ mine: message.senderId === auth.profile?.uid }">
            {{ message.text }}
          </div>
        </div>
        <form class="chat-compose" @submit.prevent="submitMessage">
          <input v-model="draft" placeholder="Write a message..." maxlength="500" />
          <button type="submit" :disabled="!draft.trim()">Send</button>
        </form>
      </div>
      <div v-else class="conversation-list">
        <p v-if="!conversations.length" class="empty-chat">No conversations yet. Open a shop or order to start chatting.</p>
        <button v-for="conversation in conversations" :key="conversation.id" class="conversation" type="button" @click="openConversation(conversation)">
          <div class="chat-avatar"><span>{{ initials(conversation.participants.find((item) => item.uid !== auth.profile?.uid)) }}</span></div>
          <div><strong>{{ conversation.participants.find((item) => item.uid !== auth.profile?.uid)?.fullName }}</strong><p>{{ conversation.lastMessage || 'Start chatting' }}</p></div>
          <b v-if="conversation.unreadCount">{{ conversation.unreadCount }}</b>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, computed } from 'vue';

import type { ChatConversation, ChatMessage, ChatParticipant } from '@/models';
import { ensureConversation, listConversations, markConversationRead, sendMessage, watchMessages } from '@/services/chat';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const open = ref(false);
const conversations = ref<ChatConversation[]>([]);
const activeConversation = ref<ChatConversation>();
const messages = ref<ChatMessage[]>([]);
const draft = ref('');
const showProfile = ref(false);
const messageList = ref<HTMLElement>();
let stopWatching: (() => void) | undefined;
const otherParticipant = computed(() => activeConversation.value?.participants.find((item) => item.uid !== auth.profile?.uid));
const unreadCount = computed(() => conversations.value.reduce((sum, item) => sum + item.unreadCount, 0));

async function load(): Promise<void> {
  if (auth.profile) conversations.value = await listConversations(auth.profile.uid);
}
async function toggleOpen(): Promise<void> {
  open.value = !open.value;
  if (open.value) await load();
}
async function openConversation(conversation: ChatConversation): Promise<void> {
  activeConversation.value = conversation;
  showProfile.value = false;
  if (auth.profile) await markConversationRead(conversation.id, auth.profile.uid);
  stopWatching?.();
  stopWatching = watchMessages(conversation.id, async (value) => {
    messages.value = value;
    await nextTick();
    if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
  });
  await load();
}
function closeConversation(): void {
  stopWatching?.();
  stopWatching = undefined;
  activeConversation.value = undefined;
  messages.value = [];
}
async function submitMessage(): Promise<void> {
  if (!auth.profile || !activeConversation.value || !draft.value.trim()) return;
  const text = draft.value.trim();
  draft.value = '';
  await sendMessage(activeConversation.value.id, auth.profile.uid, text);
}
function initials(participant?: ChatParticipant): string {
  return (participant?.fullName ?? 'User').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}
async function startChat(event: Event): Promise<void> {
  const participant = (event as CustomEvent<ChatParticipant>).detail;
  if (!auth.profile || !participant) return;
  const conversation = await ensureConversation(
    { uid: auth.profile.uid, fullName: auth.profile.fullName, role: auth.profile.role, profileImage: auth.profile.profileImage },
    participant,
  );
  await load();
  await openConversation(conversation);
  open.value = true;
}
onMounted(() => window.addEventListener('meatup:start-chat', startChat));
onBeforeUnmount(() => {
  stopWatching?.();
  window.removeEventListener('meatup:start-chat', startChat);
});
</script>

<style scoped>
.chat-widget { bottom: 1.25rem; position: fixed; right: 1.25rem; z-index: 1200; }
.chat-fab { background: var(--meatup-primary); border: 0; border-radius: 50%; box-shadow: 0 8px 22px #43110d40; color: white; cursor: pointer; font-size: 1.35rem; height: 3.4rem; position: relative; width: 3.4rem; }
.chat-badge { background: #e11d48; border: 2px solid white; border-radius: 999px; font-size: 0.65rem; padding: 0.15rem 0.3rem; position: absolute; right: -0.2rem; top: -0.1rem; }
.chat-panel { background: white; border: 1px solid #eadfd8; border-radius: 16px; bottom: 4.1rem; box-shadow: 0 14px 40px #43110d26; height: min(520px, calc(100vh - 7rem)); overflow: hidden; position: absolute; right: 0; width: min(360px, calc(100vw - 2rem)); }
.chat-header { align-items: center; background: var(--meatup-primary); color: white; display: flex; justify-content: space-between; padding: 0.85rem 1rem; }
.chat-header button { background: transparent; border: 0; color: white; cursor: pointer; font-size: 1.4rem; }
.chat-body, .conversation-list { height: calc(100% - 3.2rem); }
.conversation-list { overflow-y: auto; }
.conversation { align-items: center; background: white; border: 0; border-bottom: 1px solid #f1e7e1; cursor: pointer; display: flex; gap: 0.7rem; padding: 0.8rem; text-align: left; width: 100%; }
.conversation > div:nth-child(2) { flex: 1; min-width: 0; }
.conversation p { color: var(--meatup-muted); font-size: 0.75rem; margin: 0.2rem 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conversation b { background: var(--meatup-primary); border-radius: 999px; color: white; font-size: 0.7rem; padding: 0.2rem 0.4rem; }
.chat-avatar { align-items: center; background: #f5b773; border-radius: 50%; color: var(--meatup-primary); display: flex; flex: 0 0 2.2rem; font-size: 0.7rem; font-weight: 800; height: 2.2rem; justify-content: center; overflow: hidden; }
.chat-avatar img { height: 100%; object-fit: cover; width: 100%; }
.profile-strip { align-items: center; border-bottom: 1px solid #f1e7e1; display: flex; gap: 0.6rem; padding: 0.65rem 0.8rem; }
.profile-strip button { background: none; border: 0; color: var(--meatup-primary); cursor: pointer; display: block; font-size: 0.7rem; padding: 0.25rem 0; }
.profile-card { background: #fff8f0; font-size: 0.75rem; padding: 0.55rem 0.8rem; }
.profile-card p { margin: 0.2rem 0; }
.messages { display: flex; flex-direction: column; gap: 0.45rem; height: calc(100% - 9rem); overflow-y: auto; padding: 0.8rem; }
.message { align-self: flex-start; background: #f1e7e1; border-radius: 12px 12px 12px 2px; font-size: 0.8rem; max-width: 80%; padding: 0.55rem 0.7rem; }
.message.mine { align-self: flex-end; background: var(--meatup-primary); border-radius: 12px 12px 2px 12px; color: white; }
.chat-compose { border-top: 1px solid #eadfd8; display: flex; gap: 0.4rem; padding: 0.65rem; }
.chat-compose input { border: 1px solid #eadfd8; border-radius: 999px; flex: 1; min-width: 0; padding: 0.55rem 0.7rem; }
.chat-compose button { background: var(--meatup-primary); border: 0; border-radius: 999px; color: white; padding: 0 0.8rem; }
.empty-chat { color: var(--meatup-muted); font-size: 0.8rem; padding: 1.5rem; text-align: center; }
@media (max-width: 480px) { .chat-widget { bottom: 5.3rem; } }
</style>
