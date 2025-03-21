<template>
  <div class="bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div
        class="mx-auto flex text-center max-w-2xl flex-col gap-16 bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20"
      >
        <div class="w-full flex flex-col">
          <h1 class="corinthia text-6xl font-bold tracking-tight text-white sm:text-9xl">The Daily Fact</h1>
          <p class="mt-6 text-lg leading-8 text-gray-300">One day, one fact.</p>
          <div class="text-lg leading-8 text-gray-300">
            <span class="text-indigo-400">The Daily Fact</span> is a place to read a new fact every day. As you read, you will discover new
            things about the world.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeo({
  title: "The Daily Fact",
  description: "One day, one fact",
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Corinthia");

.corinthia {
  font-family: "Corinthia", serif;
}
</style>
