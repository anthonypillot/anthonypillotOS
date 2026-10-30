<template>
  <section class="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50" aria-label="Team chat">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      :aria-label="open ? 'Close chat' : 'Open chat'"
      :aria-expanded="open"
      aria-controls="task-holdem-chat"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 text-sm font-medium text-slate-200"><UIcon name="i-heroicons-chat-bubble-left-right" class="size-4 text-indigo-300" aria-hidden="true" /> Team chat <span v-if="messages.length" class="text-xs text-slate-500">{{ messages.length }}</span></span>
      <UIcon name="i-heroicons-chevron-down" class="size-4 text-slate-500 transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
    </button>
    <div v-if="open" id="task-holdem-chat" class="border-t border-white/5">
      <div
        ref="messageList"
        role="log"
        aria-label="Room messages"
        aria-live="polite"
        class="flex h-64 flex-col gap-4 overflow-y-auto p-5"
      >
        <p v-if="messages.length === 0" class="my-auto text-center text-xs leading-6 text-slate-500">No messages yet<br>Keep the conversation going.</p>
        <div v-for="message in messages" :key="message.id" class="min-w-0 text-sm">
          <span class="text-xs font-medium text-indigo-300">{{ message.author.name }}:</span>
          <p class="mt-1 whitespace-pre-wrap break-words text-slate-300">{{ message.content }}</p>
        </div>
      </div>
      <form class="space-y-3 border-t border-white/5 p-4" @submit.prevent="submit">
        <UInput v-model="draft" placeholder="Your message" aria-label="Your message" :maxlength="2000" :disabled="disabled" class="w-full" />
        <div class="flex items-center justify-between gap-2">
          <p class="text-[10px] text-slate-500">Chat isn't saved between visits.</p>
          <UButton type="submit" label="Send" trailing-icon="i-heroicons-paper-airplane" size="xs" :disabled="disabled || !draft.trim()" :loading="sending" />
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemMessage } from "#shared/types/task-holdem.type";

const props = defineProps<{ messages: TaskHoldemMessage[]; disabled: boolean; sending: boolean }>();
const draft = defineModel<string>({ default: "" });
const emit = defineEmits<{ submit: [content: string] }>();
const open = ref(false);
const messageList = ref<HTMLElement | null>(null);

function submit(): void {
  if (!props.disabled && !props.sending && draft.value.trim()) emit("submit", draft.value.trim());
}

watch(() => [props.messages.length, open.value], async () => {
  await nextTick();
  if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
});
</script>
