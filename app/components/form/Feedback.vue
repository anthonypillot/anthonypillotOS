<template>
  <UModal
    v-model:open="open"
    :title="isFeedbackSubmitted ? 'Thank you!' : title"
    :description="isFeedbackSubmitted ? 'Your feedback has been submitted.' : description"
    :close="!isLoading"
    :dismissible="!isLoading"
    @after:leave="resetFeedback"
  >
    <slot />
    <template #body>
      <UForm v-if="!isFeedbackSubmitted" :state="state" :validate="validate" class="flex flex-col gap-4" @submit="onSubmit">
        <p v-if="submissionError" role="alert" class="text-sm text-error">{{ submissionError }}</p>
        <UFormField name="name" label="Name" hint="Optional">
          <UInput v-model="state.name" type="text" class="w-full" autofocus />
        </UFormField>
        <UFormField name="email" label="Email" hint="Optional">
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>
        <UFormField name="message" label="Feedback" required>
          <UTextarea v-model="state.message" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-4">
          <UButton label="Cancel" variant="outline" :disabled="isLoading" @click="open = false" />
          <UButton label="Submit" type="submit" :loading="isLoading" />
        </div>
      </UForm>
      <UIcon v-else name="i-heroicons-check-circle-20-solid" class="size-10 text-success" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormError } from "@nuxt/ui";

type Props = {
  title?: string;
  description?: string;
};

const { title = "Feedback", description = "Please provide your feedback" } = defineProps<Props>();
const open = ref(false);

export type Feedback = {
  name: string | undefined;
  email: string | undefined;
  message: string;
};

const state = reactive<Feedback>({
  name: undefined,
  email: undefined,
  message: "",
});

function validate(state: Partial<Feedback>): FormError[] {
  const errors: FormError[] = [];
  if (!state.message) errors.push({ name: "message", message: "Feedback is required" });
  return errors;
}

const isLoading = ref<boolean>(false);
const submissionError = ref<string | null>(null);
let submitTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

async function onSubmit(): Promise<void> {
  if (isLoading.value) return;
  submissionError.value = null;
  try {
    isLoading.value = true;

    await $fetch("/api/form/feedback", {
      method: "POST",
      body: JSON.stringify(state),
      timeout: 10_000,
    });

    submitTimer = setTimeout(() => {
      state.name = undefined;
      state.email = undefined;
      state.message = "";

      isLoading.value = false;
      setIsFeedbackSubmitted();
    }, 2000);
  } catch {
    isLoading.value = false;
    submissionError.value = "Your feedback couldn't be sent. Please try again.";
  }
}

const isFeedbackSubmitted = ref<boolean>(false);

function setIsFeedbackSubmitted(): void {
  isFeedbackSubmitted.value = true;

  closeTimer = setTimeout(() => {
    isFeedbackSubmitted.value = false;
    open.value = false;
  }, 3000);
}

function resetFeedback(): void {
  clearTimeout(submitTimer);
  clearTimeout(closeTimer);
  state.name = undefined;
  state.email = undefined;
  state.message = "";
  isFeedbackSubmitted.value = false;
  submissionError.value = null;
}

onScopeDispose(() => {
  clearTimeout(submitTimer);
  clearTimeout(closeTimer);
});
</script>
