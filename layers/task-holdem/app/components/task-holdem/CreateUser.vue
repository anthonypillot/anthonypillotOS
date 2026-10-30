<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your seat at the table</p>
      <h2 class="mt-3 text-2xl font-semibold tracking-tight text-highlighted">{{ creating ? 'Bring your team together.' : 'Ready when you are.' }}</h2>
      <p class="mt-3 text-sm leading-6 text-muted">{{ creating ? 'Create a room, share the link, and find your next estimate together.' : 'Choose how your teammates will see you. No account needed.' }}</p>
    </div>
    <div class="space-y-2">
      <label for="task-holdem-name" class="text-sm font-medium text-default">Your name</label>
      <UInput id="task-holdem-name" v-model="name" placeholder="Your name" autocomplete="nickname" :maxlength="40" size="lg" class="w-full" />
    </div>
    <fieldset>
      <legend class="mb-3 text-sm font-medium text-default">Choose your companion</legend>
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
          <TaskHoldemMascot :avatar="option.value" class="size-14" />
          <span class="text-xs font-medium text-default">{{ option.name }}</span>
          <UIcon v-if="avatar === option.value" name="i-heroicons-check-circle-solid" class="absolute right-2 top-2 size-4 text-primary" aria-hidden="true" />
        </label>
      </div>
    </fieldset>
    <p class="-mt-2 text-center text-xs text-muted" aria-live="polite">{{ taskHoldemMascots[avatar].description }}</p>
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
import type { TaskHoldemProfile } from "../../../shared/types/task-holdem.type";
import { taskHoldemAvatarSchema } from "../../../shared/schemas/task-holdem.schema";
import { taskHoldemMascots } from "../../../shared/data/task-holdem-mascots";

const props = defineProps<{ profile: TaskHoldemProfile; creating: boolean; disabled: boolean; busy: boolean }>();
const emit = defineEmits<{ submit: [profile: TaskHoldemProfile] }>();
const name = ref(props.profile.name);
const avatar = ref<TaskHoldemProfile["avatar"]>(props.profile.avatar);
const avatars = taskHoldemAvatarSchema.options.map(value => ({ value, ...taskHoldemMascots[value] }));

function submit(): void {
  if (!props.disabled && name.value.trim()) emit("submit", { name: name.value.trim(), avatar: avatar.value });
}
</script>
