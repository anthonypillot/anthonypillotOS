<template>
  <div id="github-history-cleaner" class="flex justify-center space-y-10 divide-y divide-gray-900/10 md:px-8">
    <div class="lg:grid lg:grid-cols-3 lg:gap-x-4 max-w-screen-xl">
      <div class="pb-4 px-4 sm:px-0 lg:pb-0">
        <h2 class="text-white font-semibold leading-7">GitHub History Cleaner</h2>
        <p class="text-sm leading-6 text-gray-400">
          This tool will help you clean up your GitHub history by deleting all workflow runs, deployments, releases, packages, and other.<br />
          The application needs a GitHub Personal Access Token (PAT) to be able to delete your history. However,
          <span class="text-gray-200">your GitHub Personal Access Token will never be stored</span>.
        </p>
        <p class="text-sm leading-6 text-gray-400">
          If you want to learn more about how we use your token, please see how we use your token in our
          <NuxtLink :href="config.app.website.link.githubRepository" target="_blank" class="text-indigo-500 hover:text-indigo-400"
            >GitHub repository</NuxtLink
          >.
        </p>
      </div>

      <div class="lg:col-start-2 lg:col-end-4">
        <form @submit.prevent="submit()" class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div class="px-4 py-6 sm:px-8 sm:py-6">
            <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <label for="account-name" class="block text-sm font-medium leading-6 text-gray-900">Account name or organization</label>
                <div class="">
                  <input
                    v-model="form.account"
                    type="text"
                    required
                    placeholder="my-account-or-organization"
                    autocomplete="username"
                    class="block w-full rounded-md border-0 mt-1 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div class="sm:col-span-3">
                <label for="repository-name" class="block text-sm font-medium leading-6 text-gray-900">Repository</label>
                <div class="">
                  <input
                    v-model="form.repository"
                    type="text"
                    required
                    placeholder="my-repository"
                    autocomplete="username"
                    class="block w-full rounded-md border-0 mt-1 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div class="sm:col-span-4">
                <label for="github-pat" class="block text-sm font-medium leading-6 text-gray-900">GitHub Personal Access Token (PAT)</label>
                <p class="text-sm leading-6 text-gray-400">
                  <NuxtLink
                    href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic"
                    class="text-indigo-500 hover:text-indigo-400"
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    >How to create a GitHub Personal Access Token (PAT) ?</NuxtLink
                  >
                </p>
                <p class="text-sm leading-6 text-gray-400">
                  The PAT should have the "<span class="text-gray-800">repo</span>" <span class="text-gray-800">scope</span>, with "<span
                    class="text-gray-800"
                    >Full control of private repositories</span
                  >", which grants access to all repositories associated with your GitHub account. It ensures that your project can interact
                  with all repositories, including fetching private repositories, and performing other necessary operations.
                </p>
                <div class="relative">
                  <input
                    v-model="form.token"
                    type="password"
                    required
                    placeholder="ghp_1234567890abcdefghij"
                    autocomplete="current-password"
                    :class="`block w-full rounded-md border-0 mt-1 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      validation.githubPatIsNotValid
                        ? 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500'
                        : 'text-gray-900 ring-gray-300 placeholder:text-gray-400'
                    }`"
                  />
                  <div v-if="validation.githubPatIsNotValid" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ExclamationCircleIcon class="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                </div>
                <p v-if="validation.githubPatIsNotValid" class="text-sm text-red-600">
                  GitHub PAT should start with <span style="font-family: monospace">ghp_</span>.
                </p>
              </div>
              <div class="sm:col-span-6">
                <label class="block text-sm font-medium leading-6 text-gray-900">Deleting options</label>
                <div v-for="option in options" class="relative flex items-start pt-1.5">
                  <div class="flex h-6 items-center">
                    <input
                      type="checkbox"
                      :id="option.name"
                      :name="option.name"
                      :aria-describedby="option.description"
                      :checked="option.checked"
                      :disabled="option.disabled"
                      class="h-4 w-4 rounded focus:ring-indigo-600 text-indigo-600 cursor-pointer disabled:cursor-not-allowed border-gray-400 disabled:border-gray-300"
                      @click="
                        option.checked = !option.checked;
                        option.checked ? form.options.push(option.name) : form.options.splice(form.options.indexOf(option.name), 1);
                      "
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label :for="option.name" class="font-medium text-gray-900">
                      <span v-html="option.label" :class="option.disabled ? 'cursor-not-allowed' : 'cursor-pointer'" />
                    </label>
                    <p class="text-gray-400">{{ option.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-x-6 border-t border-gray-900/10 p-4 sm:px-8 sm:py-6">
            <button @click="clear()" type="button" class="text-sm font-semibold leading-6 text-gray-900">Clear</button>
            <button
              :class="`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600`"
              :disabled="disabled.submit"
            >
              Submit
            </button>
          </div>
        </form>
        <div v-if="result" class="pt-8">
          <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div class="px-4 py-6 sm:px-8 sm:py-6">
              <div class="px-4 sm:px-0">
                <div ref="resultHtml" class="flex">
                  <BarsArrowDownIcon class="h-10 w-10 mr-2" aria-hidden="true" />
                  <p class="text-xl text-gray-900 font-semibold leading-7">Cleaner history result</p>
                </div>
                <div v-if="result.workflow">
                  <p class="pt-1 text-gray-900 font-semibold leading-7">Workflow deletion</p>
                  <p v-if="result.workflow.success > 0" class="text-sm leading-6 text-gray-600">
                    Number of workflow runs deleted with success: <span class="font-semibold">{{ result.workflow.success }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.notFound > 0" class="text-sm leading-6 text-gray-600">
                    Number workflow runs not found: <span class="font-semibold">{{ result.workflow.notFound }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.unauthorized > 0" class="text-sm leading-6 text-gray-600">
                    Number of workflow unauthorized to delete: <span class="font-semibold">{{ result.workflow.unauthorized }}</span
                    >.
                  </p>
                  <p v-if="result.workflow.unknown > 0" class="text-sm leading-6 text-gray-600">
                    Number of workflow runs not deleted for unknown reason:
                    <span class="font-semibold">{{ result.workflow.unknown }}</span
                    >.
                  </p>
                </div>
                <div v-else>
                  <p class="pt-1 text-gray-900 leading-7">Everything went as expected, but nothing was found to delete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirmation modal -->
  <TransitionRoot as="template" :show="confirmationModal">
    <Dialog as="div" class="relative z-10" @close="confirmationModal = false">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            >
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
                >
                  <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">Confirm deletion</DialogTitle>
                  <div class="">
                    <p class="text-sm text-gray-600 pt-2">
                      Are you sure you want to delete the history of your GitHub account
                      <span class="font-semibold">{{ form.account }}</span>
                      and repository
                      <span class="font-semibold">{{ form.repository }}</span> ?
                    </p>
                  </div>
                  <div v-for="formOption in form.options" class="pt-2">
                    <div class="flex">
                      <ArrowRightCircleIcon class="h-5 w-5 mr-1" aria-hidden="true" />
                      <p
                        v-html="`${options.find((option) => option.name === formOption)?.label} will be deleted.`"
                        class="text-sm text-gray-600"
                      ></p>
                    </div>
                  </div>
                  <div class="pt-2">
                    <p class="text-sm text-gray-600">This action <span class="font-semibold">cannot be undone</span>.</p>
                  </div>
                </div>
              </div>
              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  :disabled="loading"
                  @click="confirm()"
                >
                  <div v-if="loading">
                    <ArrowPathIcon class="animate-spin h-5 w-5" />
                  </div>
                  <div v-else>Confirm</div>
                </button>
                <button
                  type="button"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
                  :disabled="loading"
                  @click="confirmationModal = false"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import {
  ArrowPathIcon,
  ArrowRightCircleIcon,
  BarsArrowDownIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

const config = useRuntimeConfig();

const disabled = ref({
  submit: true,
});
const options = ref([
  {
    name: "all-workflow-runs",
    label: "All workflow runs history",
    description: "Delete all workflow runs history.",
    disabled: false,
    checked: true,
  },
  {
    name: "only-workflow-runs-in-error",
    label: "Only workflow runs history in error <span class='font-bold'>(available soon)</span>",
    description: "Delete all workflow runs history in error.",
    disabled: true,
    checked: false,
  },
  {
    name: "all-deployments",
    label: "All deployment history <span class='font-bold'>(available soon)</span>",
    description: "Delete all deployment history.",
    disabled: true,
    checked: false,
  },
]);
const form = ref<HistoryCleanerForm>({
  account: "",
  repository: "",
  token: "",
  options: [],
});
const validation = ref({
  githubPatIsNotValid: false,
});
const confirmationModal = ref(false);
const loading = ref<boolean>(false);
const result = ref<HistoryCleanerResultFiltered | null>(null);
const resultHtml = ref<HTMLDivElement | null>(null);

/**
 * Add checked options to form.
 */
options.value.forEach((option) => {
  if (option.checked) {
    form.value.options.push(option.name);
  }
});

/**
 * Form validation.
 */
watch(
  form.value,
  (updated) => {
    let submitIsDisabled = false;
    let githubPatIsInvalid = false;

    if (updated.account && updated.repository && updated.options.length > 0) {
      submitIsDisabled = false;
    } else {
      submitIsDisabled = true;
    }

    if (updated.token !== "") {
      if (updated.token.startsWith("ghp_")) {
        githubPatIsInvalid = false;
      } else {
        submitIsDisabled = true;
        githubPatIsInvalid = true;
      }
    } else {
      submitIsDisabled = true;
      githubPatIsInvalid = false;
    }

    disabled.value.submit = submitIsDisabled;
    validation.value.githubPatIsNotValid = githubPatIsInvalid;
  },
  {
    deep: true,
  }
);

function submit(): void {
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

<style lang="scss" scoped>
* {
  font-family: sans-serif;
}
</style>
