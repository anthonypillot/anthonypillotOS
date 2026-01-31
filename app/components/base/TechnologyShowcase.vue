<template>
  <section
    class="hidden mx-auto sm:flex max-w-2xl xl:max-w-7xl flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch"
  >
    <article>
      <h2 class="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">Technology showcase</h2>
      <p class="mt-2 text-lg leading-8 text-gray-200">All the technologies I have used during my career.</p>
      <div class="mt-4 flex flex-wrap gap-4">
        <div class="bg-gray-500/5 rounded-xl size-60 flex flex-col place-items-center justify-center text-center">
          <p class="text-2xl text-white">
            <ClientOnly>
              <BaseCounterAnimation :from="0" :to="yearsOfExperience" :duration="10" :start-when="true" />
              <span class="text-indigo-400"> years</span>
            </ClientOnly>
          </p>
        </div>
        <div class="bg-gray-500/5 rounded-xl size-60 flex flex-col place-items-center justify-center text-center">
          <p class="text-2xl text-white">
            <ClientOnly>
              <BaseCounterAnimation :from="0" :to="numberOfTechnologies" :duration="10" :start-when="true" />+
              <span class="text-indigo-400">technologies</span>
            </ClientOnly>
          </p>
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-4">
        <p class="text-sm leading-8 text-gray-200">
          During my <span class="font-bold">{{ yearsOfExperience }} years</span> of experience, I have used a variety of technologies
          throughout my career.
        </p>
        <p class="text-sm leading-8 text-gray-200">
          I have experience with a wide range of technologies. I have worked with both frontend and backend technologies, and I have
          experience with both monolithic and microservices architectures. Mono-repos, multi-repos. Library creation, GitHub composite
          actions, reusable workflows, etc.
        </p>
        <p class="text-sm leading-8 text-gray-200">{{ icons?.map((icon) => icon.name).join(", ") }} and more.</p>
      </div>
    </article>
    <BaseIconPhysicalBlock />
  </section>
</template>

<script setup lang="ts">
const yearsOfExperience: number = new Date().getFullYear() - 2020;

const { data } = await useFetch("/api/icons", {
  key: "icons",
});

const icons = data.value;

const numberOfTechnologies = icons?.length || 30;
</script>
