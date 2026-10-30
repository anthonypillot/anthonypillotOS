<template>
  <section aria-labelledby="round-topic-heading" class="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 id="round-topic-heading" class="text-xs font-medium uppercase tracking-wider text-indigo-300">Current topic</h2>
        <p v-if="!editing" class="mt-2 break-words text-lg font-medium" :class="round.topic ? 'text-white' : 'text-slate-500'">{{ round.topic || 'What are we estimating?' }}</p>
      </div>
      <UButton v-if="!editing && round.phase === 'voting'" :label="round.topic ? 'Edit topic' : 'Add topic'" icon="i-heroicons-pencil-square" color="neutral" variant="ghost" size="xs" :disabled="disabled" @click="startEditing" />
      <UIcon v-if="round.phase !== 'voting'" name="i-heroicons-lock-closed" class="size-4 shrink-0 text-slate-500" aria-label="Topic locked" />
    </div>
    <form v-if="editing && round.phase === 'voting'" class="mt-4 space-y-3" @submit.prevent="save">
      <label for="round-topic" class="sr-only">Round topic</label>
      <UInput id="round-topic" ref="input" v-model="draft" placeholder="e.g. PROJ-123 · Improve the sign-in flow" :maxlength="160" :disabled="saving || disabled" class="w-full" autofocus />
      <p v-if="conflicted" role="status" class="text-xs leading-5 text-amber-300">A teammate updated the topic to “{{ round.topic || 'No topic' }}”. Your draft is kept. Cancel to use their version, or save again to replace it.</p>
      <div class="flex items-center justify-between gap-3">
        <p class="text-[11px] text-slate-500">Optional · Shared with everyone · {{ draft.length }}/160</p>
        <div class="flex gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" size="xs" :disabled="saving" @click="editing = false" />
          <UButton type="submit" label="Save topic" size="xs" :disabled="disabled" :loading="saving" />
        </div>
      </div>
    </form>
    <p v-else class="mt-2 text-xs text-slate-500">{{ round.phase === 'voting' ? 'Add a ticket reference or a short title. It will be saved with this round.' : 'Saved with the round. The next round starts with a fresh topic.' }}</p>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemRoom } from "../../../shared/types/task-holdem.type";

const props = defineProps<{
  round: TaskHoldemRoom["round"];
  disabled: boolean;
  saveTopic: (topic: string, previousTopic: string | null) => Promise<boolean>;
}>();
const editing = ref(false);
const saving = ref(false);
const draft = ref("");
const originalTopic = ref<string | null>(null);
const input = useTemplateRef("input");
const conflicted = computed(() => editing.value && originalTopic.value !== props.round.topic);

async function startEditing(): Promise<void> {
  originalTopic.value = props.round.topic;
  draft.value = props.round.topic ?? "";
  editing.value = true;
  await nextTick();
  input.value?.inputRef?.focus();
}

async function save(): Promise<void> {
  if (saving.value || props.disabled) return;
  const roundId = props.round.id;
  saving.value = true;
  try {
    if (await props.saveTopic(draft.value.trim(), props.round.topic) && props.round.id === roundId) editing.value = false;
  } finally {
    saving.value = false;
  }
}

watch([() => props.round.id, () => props.round.phase], () => { editing.value = false; });
</script>
