<template>
  <section v-if="isOpen" class="fixed inset-0 z-20 flex items-center bg-gray-400/50 text-black">
    <div class="w-full p-4 mx-auto md:max-w-lg">
      <div class="rounded-lg bg-white p-8 shadow-lg">
        <UForm v-if="!isFeedbackSubmitted" :state="state" :validate="validate" class="flex flex-col gap-4" @submit="onSubmit">
          <div>
            <p class="text-2xl">{{ title }}</p>
            <p class="text-sm">{{ description }}</p>
          </div>
          <UFormField name="name" label="Name" hint="Optional">
            <UInput v-model="state.name" type="text" class="w-full" />
          </UFormField>
          <UFormField name="email" label="Email" hint="Optional">
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField name="message" label="Feedback" required>
            <UTextarea v-model="state.message" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-4">
            <UButton label="Cancel" variant="outline" @click="$emit('close')" />
            <UButton label="Submit" type="submit" :loading="isLoading" />
          </div>
        </UForm>
        <div v-else class="flex flex-col gap-2">
          <UIcon name="i-heroicons-20-solid-check-circle" class="h-10 w-10" />
          <p class="text-2xl">Thank you!</p>
          <p class="text-sm">Your feedback has been submitted.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FormError } from "@nuxt/ui";

type Props = {
  isOpen: boolean;
  title?: string;
  description?: string;
};

const { isOpen, title = "Feedback", description = "Please provide your feedback" } = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

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

async function onSubmit(): Promise<void> {
  try {
    isLoading.value = true;

    await $fetch("/api/form/feedback", {
      method: "POST",
      body: JSON.stringify(state),
    });

    setTimeout(() => {
      state.name = undefined;
      state.email = undefined;
      state.message = "";

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
