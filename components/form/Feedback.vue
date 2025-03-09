<template>
  <section v-if="isOpen" class="fixed inset-0 z-20 flex items-center bg-gray-400/50 text-black">
    <div class="w-full p-4 mx-auto md:max-w-lg">
      <div class="rounded-lg bg-white p-8 shadow-lg">
        <form v-if="!isFeedbackSubmitted" class="flex flex-col gap-8" @submit.prevent="submit()">
          <div>
            <p class="text-2xl">{{ title }}</p>
            <p class="text-sm">{{ description }}</p>
          </div>
          <div class="flex flex-col gap-4">
            <label
              for="name"
              class="relative block rounded-md border border-gray-200 shadow-xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <input
                v-model="feedback.name"
                type="text"
                id="name"
                class="w-full peer border-none bg-transparent placeholder-transparent focus:border-transparent focus:ring-0 focus:outline-hidden"
                placeholder="Name"
              />
              <span
                class="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white p-0.5 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs"
              >
                Name (optional)
              </span>
            </label>
            <label
              for="email"
              class="relative block rounded-md border border-gray-200 shadow-xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <input
                v-model="feedback.email"
                type="email"
                id="email"
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
              :class="
                'group relative inline-flex items-center overflow-hidden rounded-lg bg-indigo-600 px-8 py-2 text-white focus:ring-3 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed' +
                (isLoading ? ' opacity-50 cursor-progress' : '')
              "
              :disabled="isSubmitDisabled"
            >
              <div v-if="isLoading">
                <ArrowPathIcon class="animate-spin h-5 w-5" />
              </div>
              <div v-else>
                <span class="absolute -end-full transition-all group-hover:end-4">
                  <PaperAirplaneIcon class="h-5 w-5" />
                </span>
                <span class="text-md font-medium transition-all group-hover:me-4">Submit</span>
              </div>
            </button>
          </div>
        </form>
        <div v-else class="flex flex-col gap-2">
          <CheckCircleIcon class="h-10 w-10" />
          <p class="text-2xl">Thank you!</p>
          <p class="text-sm">Your feedback has been submitted.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PaperAirplaneIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/vue/20/solid";

type Props = {
  isOpen: boolean;
  title?: string;
  description?: string;
};

const { isOpen, title = "Feedback", description = "Please provide your feedback" } = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const isSubmitDisabled = computed(() => {
  return !feedback.value.message || isLoading.value;
});

export type Feedback = {
  name: string | null;
  email: string | null;
  message: string;
};

const feedback = ref<Feedback>({
  name: null,
  email: null,
  message: "",
});

const isLoading = ref<boolean>(false);

async function submit(): Promise<void> {
  try {
    isLoading.value = true;

    await $fetch("/api/form/feedback", {
      method: "POST",
      body: JSON.stringify(feedback.value),
    });

    setTimeout(() => {
      feedback.value = {
        name: null,
        email: null,
        message: "",
      };

      isLoading.value = false;
      setIsFeedbackSubmitted();
    }, 2000);
  } catch (error) {
    console.error(error);
  }
}

const isFeedbackSubmitted = ref<boolean>(false);

function setIsFeedbackSubmitted(): void {
  isFeedbackSubmitted.value = true;

  setTimeout(() => {
    isFeedbackSubmitted.value = false;
    emit("close");
  }, 3000);
}
</script>
