<template>
  <div>
    <!-- Header -->
    <BaseHeader :data="data" />

    <!-- Main content -->
    <main>
      <!-- Hero section -->
      <BaseHero :data="data" />
    </main>

    <!-- Footer -->
    <BaseFooter :data="data" />
  </div>
</template>

<script setup lang="ts">
const data = {
  email: {
    owner: "pillot.anthony@gmail.com",
  },
  url: {
    linkedIn: "https://www.linkedin.com/in/anthony-pillot",
    githubAccount: "https://github.com/anthonypillot",
    githubRepository: "https://github.com/anthonypillot/anthonypillotOS",
    githubOrganization: "https://github.com/size-up",
    githubFreeGamesCatcherCore: "https://github.com/size-up/freegamescatcher-core",
    sizeUpDocumentation: "https://docs.sizeup.cloud",
  },
};
</script>
