<template>
  <UButton ref="trigger" label="Reveal cards" icon="i-heroicons-eye" size="lg" class="mt-4 justify-center" :disabled="!canReveal" data-testid="reveal-button" @click="requestReveal" />
  <UModal v-model:open="open" title="Reveal before everyone votes?" description="Revealing locks all votes. You can wait, or reveal the votes already cast." :content="{ onOpenAutoFocus: focusCancel, onCloseAutoFocus: restoreFocus }" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div aria-live="polite" aria-atomic="true">
        <p class="text-sm text-toned">{{ missing.length ? `${missing.length} ${missing.length === 1 ? 'player has' : 'players have'} not voted yet:` : 'Everyone has now voted. Reveal when you are ready.' }}</p>
        <ul v-if="missing.length" aria-label="Players without a vote" class="mt-3 max-h-60 space-y-2 overflow-y-auto text-sm text-default">
          <li v-for="participant in missing" :key="participant.id" class="break-words">{{ participant.profile.name }}<span v-if="!participant.connected" class="ml-2 text-xs text-warning">Reconnecting…</span></li>
        </ul>
      </div>
    </template>
    <template #footer>
      <UButton ref="cancel" label="Keep voting" color="neutral" variant="outline" @click="open = false" />
      <UButton :label="missing.length ? 'Reveal anyway' : 'Reveal cards now'" :disabled="!canReveal" @click="confirmReveal" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TaskHoldemRoom } from "../../../shared/types/room.type";

const props = defineProps<{ room: TaskHoldemRoom; disabled: boolean }>();
const emit = defineEmits<{ reveal: [] }>();
const open = ref(false);
const pendingRound = ref<string | null>(null);
const trigger = useTemplateRef("trigger");
const cancel = useTemplateRef("cancel");
const missing = computed(() => props.room.participants.filter(participant => !participant.hasVoted));
const canReveal = computed(() => !props.disabled && props.room.round.phase === "voting" && props.room.participants.some(participant => participant.hasVoted));

function requestReveal(): void {
  if (!canReveal.value) return;
  if (!missing.value.length) { emit("reveal"); return; }
  pendingRound.value = props.room.round.id;
  open.value = true;
}

function confirmReveal(): void {
  if (!open.value || !canReveal.value || pendingRound.value !== props.room.round.id) return;
  open.value = false;
  emit("reveal");
}

function focusCancel(event: Event): void {
  const button = cancel.value?.$el;
  if (button instanceof HTMLButtonElement) { event.preventDefault(); button.focus(); }
}

function restoreFocus(event: Event): void {
  const button = trigger.value?.$el;
  if (button instanceof HTMLButtonElement && !button.disabled) { event.preventDefault(); button.focus(); }
}

watch([() => props.room.id, () => props.room.round.id, () => props.room.round.phase, () => props.disabled], () => { open.value = false; pendingRound.value = null; });
</script>
