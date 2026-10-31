<template>
  <section aria-labelledby="round-topic-heading" class="rounded-2xl border border-default bg-muted/50 p-5 sm:p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 id="round-topic-heading" class="text-xs font-medium uppercase tracking-wider text-primary">Current topic</h2>
        <p v-if="!editing" class="mt-2 break-words text-lg font-medium" :class="round.topic ? 'text-highlighted' : 'text-muted'">{{ round.topic || 'What are we estimating?' }}</p>
      </div>
      <UButton v-if="round.phase === 'voting'" label="Edit topic" icon="i-heroicons-pencil-square" color="neutral" variant="ghost" size="xs" :disabled="disabled || !round.topic || editing || saving" @click="startEditing" />
      <UIcon v-if="round.phase !== 'voting'" name="i-heroicons-lock-closed" class="size-4 shrink-0 text-muted" aria-label="Topic locked" />
    </div>
    <form v-if="editing && round.phase === 'voting'" class="mt-4 space-y-3" @submit.prevent="save">
      <label for="round-topic" class="sr-only">Round topic</label>
      <UInput id="round-topic" ref="input" v-model="draft" placeholder="What are we estimating?" :maxlength="160" :disabled="saving || disabled" class="w-full" />
      <p v-if="conflicted" role="status" class="text-xs leading-5 text-warning">A teammate updated the topic to “{{ round.topic || 'No topic' }}”. Your draft is kept. Cancel to use their version, or save again to replace it.</p>
      <div class="flex items-center justify-between gap-3">
        <p class="text-[11px] text-muted">Optional · Shared with everyone · {{ draft.length }}/160</p>
        <div class="flex gap-2">
          <UButton v-if="round.topic || draft || conflicted" :label="round.topic || conflicted ? 'Cancel' : 'Clear'" color="neutral" variant="ghost" size="xs" :disabled="saving" @click="resetEditor" />
          <UButton type="submit" label="Save topic" size="xs" :disabled="disabled || !changed" :loading="saving" />
        </div>
      </div>
    </form>
    <p v-else class="mt-2 text-xs text-muted">{{ round.phase === 'voting' ? 'Add a ticket reference or a short title. It will be saved with this round.' : 'Saved with the round. The next round starts with a fresh topic.' }}</p>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemRoom } from "../../../shared/types/task-holdem.type";

const props = defineProps<{
  round: TaskHoldemRoom["round"];
  disabled: boolean;
  saveTopic: (topic: string, previousTopic: string | null) => Promise<boolean>;
}>();
const editing = ref(props.round.phase === "voting" && !props.round.topic);
const saving = ref(false);
const draft = ref(props.round.topic ?? "");
const originalTopic = ref(props.round.topic);
const input = useTemplateRef("input");
const conflicted = computed(() => editing.value && !saving.value && originalTopic.value !== props.round.topic);
const changed = computed(() => draft.value.trim() !== (props.round.topic ?? ""));

function resetEditor(): void {
  originalTopic.value = props.round.topic;
  draft.value = props.round.topic ?? "";
  editing.value = props.round.phase === "voting" && !props.round.topic;
}

async function startEditing(): Promise<void> {
  if (props.disabled || props.round.phase !== "voting" || !props.round.topic) return;
  originalTopic.value = props.round.topic;
  draft.value = props.round.topic ?? "";
  editing.value = true;
  await nextTick();
  input.value?.inputRef?.focus();
}

async function save(): Promise<void> {
  if (saving.value || props.disabled || !changed.value) return;
  const roundId = props.round.id;
  saving.value = true;
  try {
    if (await props.saveTopic(draft.value.trim(), props.round.topic)) {
      await nextTick();
      if (props.round.id === roundId) resetEditor();
    }
  } finally {
    saving.value = false;
  }
}

watch([() => props.round.id, () => props.round.phase], resetEditor);
watch(() => props.round.topic, () => {
  if (saving.value) return;
  const focused = import.meta.client && input.value?.inputRef === document.activeElement;
  if (!editing.value || (!focused && originalTopic.value === null && draft.value === "")) resetEditor();
});
</script>
