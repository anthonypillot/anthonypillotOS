<template>
  <section
    class="hidden mx-auto sm:flex max-w-2xl xl:max-w-7xl flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch"
  >
    <article>
      <h2 class="text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">Technology showcase</h2>
      <p class="mt-2 text-lg leading-8 text-default">All the technologies I have used during my career.</p>
      <div class="mt-4 flex flex-wrap gap-4">
        <div class="bg-elevated rounded-xl size-60 flex flex-col place-items-center justify-center text-center">
          <p class="text-2xl text-highlighted">
            <ClientOnly>
              <BaseCounterAnimation :from="0" :to="yearsOfExperience" :duration="10" :start-when="true" />
              <span class="text-primary"> years</span>
            </ClientOnly>
          </p>
        </div>
        <div class="bg-elevated rounded-xl size-60 flex flex-col place-items-center justify-center text-center">
          <p class="text-2xl text-highlighted">
            <ClientOnly>
              <BaseCounterAnimation :from="0" :to="numberOfTechnologies" :duration="10" :start-when="true" />+
              <span class="text-primary">technologies</span>
            </ClientOnly>
          </p>
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-4">
        <p class="text-sm leading-8 text-default">
          During my <span class="font-bold">{{ yearsOfExperience }} years</span> of experience, I have used a variety of technologies
          throughout my career.
        </p>
        <p class="text-sm leading-8 text-default">
          I have experience with a wide range of technologies. I have worked with both frontend and backend technologies, and I have
          experience with both monolithic and microservices architectures. Mono-repos, multi-repos. Library creation, GitHub composite
          actions, reusable workflows, etc.
        </p>
        <p class="text-sm leading-8 text-default">{{ icons?.map((icon) => icon.name).join(", ") }} and more.</p>
      </div>
    </article>
    <BaseIconPhysicalBlock />
  </section>
</template>

<script setup lang="ts">
const yearsOfExperience: number = new Date().getFullYear() - 2020 + 1;

const { data } = await useFetch("/api/icons", {
  key: "icons",
});

const icons = data.value;

const numberOfTechnologies = icons?.length || 30;
</script>
