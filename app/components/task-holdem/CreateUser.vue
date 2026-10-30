<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Your seat at the table</p>
      <h2 class="mt-3 text-2xl font-semibold tracking-tight text-white">{{ creating ? 'Bring your team together.' : 'Ready when you are.' }}</h2>
      <p class="mt-3 text-sm leading-6 text-slate-400">{{ creating ? 'Create a room, share the link, and find your next estimate together.' : 'Choose how your teammates will see you. No account needed.' }}</p>
    </div>
    <div class="space-y-2">
      <label for="task-holdem-name" class="text-sm font-medium text-slate-200">Your name</label>
      <UInput id="task-holdem-name" v-model="name" placeholder="Your name" autocomplete="nickname" :maxlength="40" size="lg" class="w-full" />
    </div>
    <fieldset>
      <legend class="mb-3 text-sm font-medium text-slate-200">Pick an avatar</legend>
      <div class="grid grid-cols-2 gap-3">
        <label
          v-for="option in avatars"
          :key="option.value"
          class="relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-indigo-400"
          :class="avatar === option.value ? 'border-indigo-400/60 bg-indigo-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'"
        >
          <input
            v-model="avatar"
            type="radio"
            name="avatar"
            :value="option.value"
            :aria-label="option.label"
            class="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none rounded-xl outline-none"
          >
          <NuxtImg :src="useAvatar(option.value)" alt="" class="size-10" />
          <span class="text-sm text-slate-200">{{ option.label }}</span>
          <UIcon v-if="avatar === option.value" name="i-heroicons-check-circle-solid" class="ml-auto size-5 text-indigo-300" aria-hidden="true" />
        </label>
      </div>
    </fieldset>
    <UButton
      type="submit"
      :label="creating ? 'Create room' : 'Join game'"
      :loading="busy"
      :disabled="!name.trim() || disabled"
      size="lg"
      trailing-icon="i-heroicons-arrow-right"
      class="w-full justify-center"
    />
    <p class="text-center text-xs leading-5 text-slate-500">We remember your name and avatar on this device.</p>
  </form>
</template>

<script setup lang="ts">
import type { TaskHoldemProfile } from "#shared/types/task-holdem.type";

const props = defineProps<{ profile: TaskHoldemProfile; creating: boolean; disabled: boolean; busy: boolean }>();
const emit = defineEmits<{ submit: [profile: TaskHoldemProfile] }>();
const name = ref(props.profile.name);
const avatar = ref<TaskHoldemProfile["avatar"]>(props.profile.avatar);
const avatars = [{ label: "Boy", value: "boy" }, { label: "Girl", value: "girl" }] satisfies { label: string; value: TaskHoldemProfile["avatar"] }[];

function submit(): void {
  if (!props.disabled && name.value.trim()) emit("submit", { name: name.value.trim(), avatar: avatar.value });
}
</script>
