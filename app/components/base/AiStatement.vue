<template>
  <section class="mx-auto w-full max-w-7xl px-6 py-16 text-center sm:py-24 lg:px-8" aria-labelledby="ai-statement-title">
    <h2 id="ai-statement-title" class="ai-statement-title text-gray-100">
      <span class="sr-only">This website is smart coded, not vibe coded.</span>
      <span aria-hidden="true">
        <span class="flex flex-wrap justify-center gap-x-[0.25em]">
          <BaseStrokeText text="This" />
          <BaseStrokeText text="website" :delay="0.08" />
          <BaseStrokeText text="is" :delay="0.16" />
        </span>
        <span class="flex flex-wrap justify-center gap-x-[0.25em]">
          <s class="vibe-text text-gray-400">
            <BaseStrokeText text="vibe" :delay="0.24" />
          </s>
          <BaseStrokeText text="smart" class="text-indigo-400" :delay="0.32" />
          <BaseStrokeText text="coded" :delay="0.4" />
        </span>
      </span>
    </h2>
    <p class="mx-auto mt-8 max-w-2xl text-base leading-8 text-gray-300 sm:mt-10 sm:text-lg">
      AI and LLMs are powerful tools for exploring ideas, accelerating development, and solving problems.
      <span class="font-semibold text-gray-100">But they must remain tools.</span>
      Engineering judgment, understanding the code, and taking responsibility for what ships stay with the developer.
    </p>
  </section>
</template>

<style scoped>
.ai-statement-title {
  font-size: clamp(2rem, 7.5vw, 6rem);
}

.vibe-text {
  position: relative;
  text-decoration: none;
}

.vibe-text::after {
  position: absolute;
  top: 53%;
  left: -5%;
  width: 110%;
  height: 0.055em;
  border-radius: 9999px;
  background: var(--color-indigo-400);
  content: "";
  transform: rotate(-8deg);
}
</style>
