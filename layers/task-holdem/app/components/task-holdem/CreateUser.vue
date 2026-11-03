<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Take a seat</p>
      <h2 class="mt-3 text-2xl font-semibold tracking-tight text-highlighted">{{ creating ? 'Bring your team together.' : 'Ready when you are.' }}</h2>
      <p class="mt-3 text-sm leading-6 text-muted">{{ creating ? 'Create a room, share the link, and find your next estimate together.' : 'Choose how your teammates will see you. No account needed.' }}</p>
    </div>
    <div class="space-y-2">
      <label for="task-holdem-name" class="text-sm font-medium text-default">Your name</label>
      <UInput id="task-holdem-name" v-model="name" placeholder="Your name" autocomplete="nickname" :maxlength="40" size="lg" class="w-full" />
    </div>
    <fieldset>
      <legend class="mb-3 text-sm font-medium text-default">Choose your character</legend>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label
          v-for="option in avatars"
          :key="option.value"
          class="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors focus-within:ring-2 focus-within:ring-primary"
          :class="avatar === option.value ? 'border-primary bg-primary/10' : 'border-accented bg-elevated/30 hover:bg-elevated/60'"
        >
          <input
            v-model="avatar"
            type="radio"
            name="avatar"
            :value="option.value"
            :aria-label="option.name"
            class="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none rounded-xl outline-none"
          >
          <TaskHoldemMascot :avatar="option.value" :presenting="avatar === option.value" :ambient="avatar === option.value" class="size-14" />
          <span class="text-xs font-medium text-default">{{ option.name }}</span>
          <UIcon v-if="avatar === option.value" name="i-heroicons-check-circle-solid" class="absolute right-2 top-2 size-4 text-primary" aria-hidden="true" />
        </label>
      </div>
    </fieldset>
    <p class="-mt-2 text-center text-xs text-muted" aria-live="polite">{{ taskHoldemMascots[avatar].description }}</p>
    <div v-if="creating" class="space-y-3">
      <label for="task-holdem-voting-scale" class="block text-sm font-medium text-default">Voting scale</label>
      <USelect id="task-holdem-voting-scale" v-model="votingScale" :items="votingScales" :disabled="disabled || busy || creationPending" aria-describedby="task-holdem-voting-scale-help" size="lg" class="w-full" />
      <p id="task-holdem-voting-scale-help" class="text-xs leading-5 text-muted">Shared by everyone and fixed for this session.</p>
      <ul aria-label="Cards in this voting scale" aria-live="polite" class="flex flex-wrap gap-1.5">
        <li v-for="card in deck" :key="card" class="rounded-md border border-default bg-elevated px-2 py-1 text-xs tabular-nums text-toned">{{ formatTaskHoldemVote(card) }}</li>
      </ul>
    </div>
    <UButton
      type="submit"
      :label="creating ? 'Create room' : 'Join game'"
      :loading="busy"
      :disabled="!name.trim() || disabled"
      size="lg"
      trailing-icon="i-heroicons-arrow-right"
      class="w-full justify-center"
    />
    <p class="text-center text-xs leading-5 text-muted">We remember your name and avatar on this device.</p>
  </form>
</template>

<script setup lang="ts">
import type { TaskHoldemProfile } from "../../../shared/types/room.type";
import { taskHoldemAvatarSchema } from "../../../shared/schemas/room.schema";
import { taskHoldemMascots } from "../../../shared/data/mascots";
import { getTaskHoldemDeck, taskHoldemVotingScales, type TaskHoldemVotingScale } from "../../../shared/data/decks";
import { formatTaskHoldemVote } from "../../utils/cards";

const props = defineProps<{ profile: TaskHoldemProfile; creating: boolean; creationPending: boolean; disabled: boolean; busy: boolean }>();
const emit = defineEmits<{ submit: [profile: TaskHoldemProfile, votingScale: TaskHoldemVotingScale] }>();
const name = ref(props.profile.name);
const avatar = ref<TaskHoldemProfile["avatar"]>(props.profile.avatar);
const votingScale = ref<TaskHoldemVotingScale>("fibonacci");
const avatars = taskHoldemAvatarSchema.options.map(value => ({ value, ...taskHoldemMascots[value] }));
const votingScales = taskHoldemVotingScales.map(({ value, label }) => ({ value, label }));
const deck = computed(() => getTaskHoldemDeck(votingScale.value));

function submit(): void {
  if (!props.disabled && !props.busy && name.value.trim()) emit("submit", { name: name.value.trim(), avatar: avatar.value }, votingScale.value);
}
</script>
