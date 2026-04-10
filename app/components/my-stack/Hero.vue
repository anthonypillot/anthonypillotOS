<template>
  <section class="relative isolate overflow-hidden bg-gray-900 pb-16 pt-24 sm:pb-20 sm:pt-32 lg:py-36">
    <!-- DotGrid Background -->
    <div class="absolute inset-0 -z-10">
      <BackgroundDotGridBackground :dot-size="12" :gap="24" base-color="#4f46e5" active-color="#818cf8" :proximity="120" />
    </div>

    <!-- Hero Section -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-3xl text-center lg:max-w-4xl">
        <!-- Text container with backdrop for readability -->
        <div class="rounded-2xl bg-gray-900/80 backdrop-blur-sm px-8 py-10 ring-1 ring-white/10 lg:px-10 lg:py-12">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            My <span class="text-indigo-400">Stack</span>
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-300 lg:mt-8 lg:text-xl">
            A deep dive into the technologies, infrastructure, and tools that power
            <span class="font-semibold text-white">anthonypillotOS</span>. Every choice is intentional, every tool is mastered.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
