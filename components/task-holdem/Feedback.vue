<template>
  <section v-if="isOpen" class="fixed inset-0 z-20 flex items-center bg-gray-400/50 text-black">
    <div class="w-full p-4 mx-auto md:max-w-lg">
      <div class="rounded-lg bg-white p-8 shadow-lg">
        <form class="flex flex-col gap-8" @submit.prevent="submit(feedback)">
          <div>
            <p class="text-2xl">{{ title }}</p>
            <p class="text-sm">{{ description }}</p>
          </div>
          <div class="flex flex-col gap-4">
            <label
              for="Email"
              class="relative block rounded-md border border-gray-200 shadow-xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <input
                v-model="feedback.email"
                type="email"
                id="Email"
                class="w-full peer border-none bg-transparent placeholder-transparent focus:border-transparent focus:ring-0 focus:outline-hidden"
                placeholder="Email"
              />
              <span
                class="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white p-0.5 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs"
              >
                Email (optional)
              </span>
            </label>
            <label
              for="message"
              class="relative block rounded-md border border-gray-200 shadow-xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <textarea
                v-model="feedback.message"
                id="message"
                class="w-full peer border-none bg-transparent placeholder-transparent focus:border-transparent focus:ring-0 focus:outline-hidden"
                placeholder="Feedback"
              />
              <span
                class="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white p-0.5 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs"
              >
                Feedback
              </span>
            </label>
          </div>

          <div class="flex justify-end gap-4">
            <button
              type="button"
              class="rounded-lg px-4 py-2 font-medium text-black border border-gray-500 sm:w-auto hover:bg-gray-500 hover:text-white"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="group relative inline-flex items-center overflow-hidden rounded-lg bg-indigo-600 px-8 py-2 text-white focus:ring-3 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitDisabled"
            >
              <span class="absolute -end-full transition-all group-hover:end-4">
                <PaperAirplaneIcon class="h-5 w-5" />
              </span>

              <span class="text-md font-medium transition-all group-hover:me-4">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PaperAirplaneIcon } from "@heroicons/vue/20/solid";

interface Props {
  isOpen: boolean;
  title?: string;
  description?: string;
}

const { isOpen, title = "Feedback", description = "Please provide your feedback." } = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const isSubmitDisabled = computed(() => !feedback.value.message);

type Feedback = {
  email: string;
  message: string;
};

const feedback = ref<Feedback>({
  email: "",
  message: "",
});

function submit(feedback: Feedback): void {
  throw new Error("Not implemented");

  try {
    $fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify(feedback),
    });

    emit("close");

    feedback = { email: "", message: "" };
  } catch (error) {
    console.error(error);
  }
}
</script>
