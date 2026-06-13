<template>
  <div id="github-history-cleaner" class="flex justify-center space-y-10 divide-y divide-gray-900/10 md:px-8">
    <div class="lg:grid lg:grid-cols-3 lg:gap-x-4 max-w-7xl">
      <div class="pb-4 px-4 sm:px-0 lg:pb-0">
        <h2 class="text-white font-semibold leading-7">GitHub History Cleaner</h2>
        <p class="text-sm leading-6 text-gray-400">
          This tool will help you clean up your GitHub history by deleting all workflow runs, deployments, releases, packages, and other.<br >
          The application needs a GitHub Personal Access Token (PAT) to be able to delete your history. However,
          <span class="text-gray-200">your GitHub Personal Access Token will never be stored</span>.
        </p>
        <p class="text-sm leading-6 text-gray-400">
          If you want to learn more about how we use your token, please see how we use your token in our
          <NuxtLink :href="config.public.link.githubRepository" target="_blank" class="text-indigo-500 hover:text-indigo-400"
            >GitHub repository</NuxtLink
          >.
        </p>
      </div>

      <div class="lg:col-start-2 lg:col-end-4">
        <UForm :schema="schema" :state="form" class="bg-elevated shadow-sm ring-1 ring-muted sm:rounded-xl" @submit="onSubmit">
          <div class="px-4 py-6 sm:px-8 sm:py-6">
            <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <UFormField name="account" label="Account name or organization" class="sm:col-span-3" required>
                <UInput v-model="form.account" placeholder="my-account-or-organization" class="w-full" />
              </UFormField>
              <UFormField name="repository" label="Repository" class="sm:col-span-3" required>
                <UInput v-model="form.repository" placeholder="my-repository" class="w-full" />
              </UFormField>
              <UFormField name="token" label="GitHub Personal Access Token (PAT)" class="sm:col-span-4">
                <template #help>
                  <p class="text-sm leading-6 text-muted">
                    <NuxtLink
                      href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic"
                      class="text-primary hover:text-primary/80"
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      >How to create a GitHub Personal Access Token (PAT) ?</NuxtLink
                    >
                  </p>
                  <p class="text-sm leading-6 text-muted">
                    The PAT should have the "<span class="text-default">repo</span>" <span class="text-default">scope</span>, with "<span
                      class="text-default"
                      >Full control of private repositories</span
                    >", which grants access to all repositories associated with your GitHub account. It ensures that your project can interact
                    with all repositories, including fetching private repositories, and performing other necessary operations.
                  </p>
                </template>
                <UInput v-model="form.token" type="password" placeholder="ghp_1234567890abcdefghij" class="w-full" />
              </UFormField>
              <div class="sm:col-span-6">
                <label class="block text-sm font-medium leading-6 text-default">Deleting options</label>
                <div v-for="(option, index) in options" :key="index" class="relative flex items-start pt-1.5">
                  <UCheckbox
                    :model-value="option.checked"
                    :description="option.description"
                    :disabled="option.disabled"
                    @update:model-value="handleOptionToggle(option.name, $event as boolean)"
                  >
                    <template #label>
                      <span v-html="option.label" />
                    </template>
                  </UCheckbox>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-x-6 border-t border-muted p-4 sm:px-8 sm:py-6">
            <UButton type="button" variant="ghost" @click="clear()">Clear</UButton>
            <UButton type="submit" :disabled="loading">Submit</UButton>
          </div>
        </UForm>
        <div v-if="result" class="pt-8">
          <div class="bg-elevated shadow-sm ring-1 ring-muted sm:rounded-xl md:col-span-2">
            <div class="px-4 py-6 sm:px-8 sm:py-6">
              <div class="px-4 sm:px-0">
                <div ref="resultHtml" class="flex">
                      <UIcon name="i-heroicons-bars-arrow-down" class="h-10 w-10 mr-2" />
                  <p class="text-xl text-default font-semibold leading-7">Cleaner history result</p>
                </div>
                <div v-if="result.workflow">
                  <p class="pt-1 text-default font-semibold leading-7">Workflow deletion</p>
                  <p v-if="result.workflow.success > 0" class="text-sm leading-6 text-muted">
                    Number of workflow runs deleted with success: <span class="font-semibold">{{ result.workflow.success }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.notFound > 0" class="text-sm leading-6 text-muted">
                    Number workflow runs not found: <span class="font-semibold">{{ result.workflow.notFound }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.unauthorized > 0" class="text-sm leading-6 text-muted">
                    Number of workflow unauthorized to delete: <span class="font-semibold">{{ result.workflow.unauthorized }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.unknown > 0" class="text-sm leading-6 text-muted">
                    Number of workflow runs not deleted for unknown reason:
                    <span class="font-semibold">{{ result.workflow.unknown }}</span
                    >.
                  </p>
                </div>
                <div v-else>
                  <p class="pt-1 text-default leading-7">Everything went as expected, but nothing was found to delete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirmation modal -->
  <UModal v-model:open="confirmationModal" :dismissible="!loading" title="Confirm deletion" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div class="sm:flex sm:items-start">
        <div class="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-6 w-6 text-red-600" />
        </div>
        <div class="mt-3 sm:ml-4 sm:mt-0 sm:text-left">
          <p class="text-sm text-muted">
            Are you sure you want to delete the history of your GitHub account
            <span class="font-semibold">{{ form.account }}</span>
            and repository
            <span class="font-semibold">{{ form.repository }}</span> ?
          </p>
          <div v-for="(formOption, index) in form.options" :key="index" class="pt-2">
            <div class="flex">
              <UIcon name="i-heroicons-arrow-right-circle" class="h-5 w-5 mr-1" />
              <p
                class="text-sm text-muted"
                v-html="`${options.find((option) => option.name === formOption)?.label} will be deleted.`"
              />
            </div>
          </div>
          <div class="pt-2">
            <p class="text-sm text-muted">This action <span class="font-semibold">cannot be undone</span>.</p>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton label="Confirm" color="error" :loading="loading" @click="confirm()" />
      <UButton label="Cancel" variant="outline" :disabled="loading" @click="confirmationModal = false" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { HistoryCleanerOptions } from "@@/server/types/history-cleaner.type";
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const config = useRuntimeConfig();

const schema = z.object({
  account: z.string().min(1, "Account name is required"),
  repository: z.string().min(1, "Repository name is required"),
  token: z
    .string()
    .min(1, "GitHub PAT is required")
    .regex(/^ghp_/, "GitHub PAT should start with ghp_"),
  options: z.array(z.string()).min(1, "At least one option is required"),
});

type Schema = z.output<typeof schema>;

const options = ref([
  {
    name: HistoryCleanerOptions.WORKFLOW_RUNS,
    label: "All workflow runs history",
    description: "Delete all workflow runs history.",
    disabled: false,
    checked: true,
  },
  {
    name: HistoryCleanerOptions.DEPLOYMENTS,
    label: "All deployment history <span class='font-bold'>(available soon)</span>",
    description: "Delete all deployment history.",
    disabled: true,
    checked: false,
  },
]);

const form = ref<Schema>({
  account: "",
  repository: "",
  token: "",
  options: [HistoryCleanerOptions.WORKFLOW_RUNS],
});

const confirmationModal = ref(false);
const loading = ref<boolean>(false);
const result = ref<HistoryCleanerResultFiltered | null>(null);
const resultHtml = ref<HTMLDivElement | null>(null);

function handleOptionToggle(name: string, checked: boolean): void {
  const option = options.value.find((o) => o.name === name);
  if (option && !option.disabled) {
    option.checked = checked;
    if (checked) {
      form.value.options.push(name);
    } else {
      form.value.options = form.value.options.filter((o) => o !== name);
    }
  }
}

async function onSubmit(_event: FormSubmitEvent<Schema>): Promise<void> {
  confirmationModal.value = true;
}

function clear(): void {
  form.value.account = "";
  form.value.repository = "";
  form.value.token = "";
  form.value.options = [];

  options.value.forEach((option) => {
    option.checked = false;
  });
}

async function confirm(): Promise<void> {
  loading.value = true;
  result.value = null;

  const data = await $fetch("/api/tools/github/history-cleaner", {
    method: "POST",
    body: JSON.stringify(form.value),

    onResponseError: (error) => {
      confirmationModal.value = false;
      loading.value = false;

      switch (error.response.status) {
        case 404:
          alert("The GitHub account or repository does not exist.");
          break;

        case 401:
        case 403:
          alert("The GitHub Personal Access Token (PAT) is not valid.");
          break;

        default:
          alert(`An error occurred, please try again later.
          ${error.response.status ? `Error status: [${error.response.status}].` : ""}
          ${error.response._data.message ? `Error message: [${error.response._data.message}].` : ""}`);
          break;
      }
    },
  });

  if (data) {
    confirmationModal.value = false;
    loading.value = false;
    result.value = data;
  } else {
    confirmationModal.value = false;
    loading.value = false;

    alert("No data received, please try again later.");
  }
}

watch(resultHtml, (updated) => {
  if (updated) {
    resultHtml.value?.scrollIntoView({ behavior: "smooth" });
  }
});
</script>

<style scoped>
* {
  font-family: sans-serif;
}
</style>
