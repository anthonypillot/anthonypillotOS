<template>
  <UPopover :ui="{ content: 'max-h-[var(--reka-popover-content-available-height)] overflow-y-auto' }">
    <UButton aria-label="Sound and notification settings" title="Sound and notification settings" :icon="preferences.muted ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'" color="neutral" variant="ghost" />
    <template #content>
      <section aria-labelledby="feedback-settings-heading" class="w-80 max-w-[calc(100vw-2rem)] space-y-5 p-5">
        <div>
          <h2 id="feedback-settings-heading" class="text-sm font-semibold text-slate-100">Sound & notifications</h2>
          <p class="mt-1 text-xs text-slate-400">Your preferences stay on this device.</p>
        </div>
        <label class="flex items-center justify-between gap-3 text-sm text-slate-200">
          Sound effects <input v-model="soundsEnabled" type="checkbox" class="size-4 accent-indigo-400" >
        </label>
        <div class="space-y-2">
          <label for="task-holdem-volume" class="flex justify-between text-xs text-slate-400">Volume <span>{{ volumePercent }}%</span></label>
          <input id="task-holdem-volume" v-model.number="volumePercent" aria-label="Sound volume" type="range" min="0" max="100" step="5" :disabled="preferences.muted" class="w-full accent-indigo-400" >
        </div>
        <fieldset class="space-y-2" :disabled="preferences.muted">
          <legend class="mb-2 text-xs font-medium text-slate-400">Play sounds for</legend>
          <label v-for="category in categories" :key="category.id" class="flex items-center justify-between gap-3 text-xs text-slate-300">
            {{ category.label }} <input v-model="preferences.categories[category.id]" type="checkbox" class="size-3.5 accent-indigo-400" >
          </label>
        </fieldset>
        <div class="flex items-center justify-between gap-2">
          <p class="text-[10px] text-slate-500">{{ audioStatus === 'unavailable' ? 'Audio is unavailable here.' : audioStatus === 'locked' ? 'Interact with the page to unlock audio.' : 'Short sounds. No background music.' }}</p>
          <UButton label="Test sound" size="xs" variant="soft" :disabled="preferences.muted || !preferences.volume || audioStatus === 'unavailable'" @click="testSound" />
        </div>
        <div class="space-y-3 border-t border-white/10 pt-4">
          <p class="text-xs font-medium text-slate-200">New round alerts</p>
          <p class="text-xs leading-5 text-slate-400">Get a browser notification while this room is open in the background.</p>
          <label v-if="permission === 'granted'" class="flex items-center justify-between gap-3 text-xs text-slate-300">
            Notify about new rounds <input v-model="preferences.notifications" type="checkbox" class="size-4 accent-indigo-400" >
          </label>
          <UButton v-else-if="permission === 'default'" label="Enable round notifications" size="xs" variant="soft" :loading="enabling" @click="enableNotifications" />
          <p v-else class="text-xs leading-5 text-amber-200/80">{{ permission === 'denied' ? 'Notifications are blocked. You can allow them in your browser’s site settings.' : 'Browser notifications are not supported here. Watch the round status in the room instead.' }}</p>
          <p v-if="notificationError" role="status" class="text-xs leading-5 text-amber-200">{{ notificationError }}</p>
          <p class="text-[10px] leading-4 text-slate-500">No alerts after closing the room. Suspended tabs may not receive updates.</p>
        </div>
      </section>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { TaskHoldemSoundCategory } from "~/utils/task-holdem-feedback";

const props = defineProps<{ feedback: ReturnType<typeof useTaskHoldemFeedback> }>();
const { preferences, audioStatus, permission, notificationError, enabling, enableNotifications, testSound } = props.feedback;
const soundsEnabled = computed({ get: () => !preferences.muted, set: (value: boolean) => { preferences.muted = !value; } });
const volumePercent = computed({ get: () => Math.round(preferences.volume * 100), set: (value: number) => { preferences.volume = value / 100; } });
const categories = [
  { id: "actions", label: "Actions & errors" }, { id: "votes", label: "Votes" }, { id: "messages", label: "Chat messages" },
  { id: "rounds", label: "Rounds & reveals" }, { id: "presence", label: "Arrivals & departures" },
] satisfies { id: TaskHoldemSoundCategory; label: string }[];
</script>
