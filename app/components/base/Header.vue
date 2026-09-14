<template>
  <header class="floating-header">
    <nav ref="navigationElement" class="header-glass header-pill" aria-label="Global">
      <NuxtLink to="/" class="header-brand" :aria-label="`${config.public.title} home`" @click="closeMenus">
        <NuxtImg quality="80" class="size-8 invert lg:size-10" :src="config.public.logo.os.raw" alt="" />
        <span class="text-sm font-semibold tracking-tight lg:text-base">{{ config.public.title }}</span>
      </NuxtLink>

      <div class="hidden items-center gap-2 lg:flex">
        <a
          v-for="item in navigation"
          :key="item.name"
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
          class="header-link"
        >
          <UIcon :name="item.icon" class="size-4.5 text-indigo-300" aria-hidden="true" />
          {{ item.name }}
        </a>
        <UPopover
          v-model:open="toolsMenuOpen"
          :content="{ align: 'center', side: 'bottom', sideOffset: 20, collisionPadding: 16 }"
          :ui="{ content: 'header-glass header-panel header-tools-panel' }"
        >
          <button
            id="popover-button-tools"
            type="button"
            class="header-link"
            :class="{ 'header-link-active': isToolsRoute }"
          >
            <UIcon name="i-heroicons-squares-2x2" class="size-4.5 text-indigo-300" aria-hidden="true" />
            Tools
            <UIcon
              name="i-heroicons-chevron-down"
              class="header-chevron size-3.5"
              :class="{ 'rotate-180': toolsMenuOpen }"
              aria-hidden="true"
            />
          </button>
          <template #content>
            <nav aria-label="Tools">
              <BaseHeaderTools @navigate="closeMenus" />
            </nav>
          </template>
        </UPopover>
      </div>

      <a
        :href="config.public.link.githubRepository"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub repository"
        class="header-link header-repository header-desktop-repository"
      >
        <UIcon name="i-heroicons-code-bracket" class="size-4.5" aria-hidden="true" />
        Repository
        <UIcon name="i-heroicons-arrow-up-right" class="size-4 text-indigo-300" aria-hidden="true" />
      </a>

      <div class="lg:hidden">
        <UPopover
          v-model:open="mobileMenuOpen"
          :reference="navigationElement ?? undefined"
          :content="{ align: 'center', side: 'bottom', sideOffset: 12, collisionPadding: 12 }"
          :ui="{ content: 'header-glass header-panel header-mobile-panel' }"
        >
          <button
            type="button"
            class="header-link header-menu-toggle"
            :aria-label="mobileMenuOpen ? 'Close main menu' : 'Open main menu'"
          >
            <UIcon :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="size-5" aria-hidden="true" />
          </button>
          <template #content>
            <nav aria-label="Mobile navigation">
              <div class="grid grid-cols-2 gap-2 border-b border-white/10 p-3">
                <a
                  v-for="item in navigation"
                  :key="item.name"
                  :href="item.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="header-link justify-between bg-white/5"
                  @click="closeMenus"
                >
                  <span class="flex items-center gap-2">
                    <UIcon :name="item.icon" class="size-4.5 text-indigo-300" aria-hidden="true" />
                    {{ item.name }}
                  </span>
                  <UIcon name="i-heroicons-arrow-up-right" class="size-3.5 text-slate-400" aria-hidden="true" />
                </a>
              </div>
              <BaseHeaderTools @navigate="closeMenus" />
              <div class="border-t border-white/10 p-3">
                <a
                  :href="config.public.link.githubRepository"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="header-link header-repository justify-center"
                  @click="closeMenus"
                >
                  <UIcon name="i-heroicons-code-bracket" class="size-4" aria-hidden="true" />
                  GitHub repository
                  <UIcon name="i-heroicons-arrow-up-right" class="size-3.5 text-indigo-300" aria-hidden="true" />
                </a>
              </div>
            </nav>
          </template>
        </UPopover>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const route = useRoute();
const navigationElement = useTemplateRef("navigationElement");
const toolsMenuOpen = ref(false);
const mobileMenuOpen = ref(false);
const isToolsRoute = computed(() => route.path === "/tools" || route.path.startsWith("/tools/"));

const navigation = [
  { name: "LinkedIn", href: config.public.link.linkedIn, icon: "i-lucide-linkedin" },
  { name: "GitHub", href: config.public.link.githubAccount, icon: "i-lucide-github" },
];

function closeMenus(): void {
  toolsMenuOpen.value = false;
  mobileMenuOpen.value = false;
}

watch(() => route.fullPath, closeMenus);

onMounted(() => {
  const desktop = window.matchMedia("(min-width: 1024px)");
  desktop.addEventListener("change", closeMenus);
  onBeforeUnmount(() => desktop.removeEventListener("change", closeMenus));
});
</script>

<style>
.floating-header {
  position: fixed;
  inset: max(0.75rem, env(safe-area-inset-top)) 0 auto;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding-inline: max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right));
  pointer-events: none;
}

.header-glass {
  color: #f8fafc;
  background: linear-gradient(135deg, rgb(255 255 255 / 8%), rgb(129 140 248 / 3%)), rgb(15 23 42 / 45%);
  border: 1px solid rgb(255 255 255 / 18%);
  box-shadow: 0 8px 32px -12px rgb(0 0 0 / 35%), inset 0 1px 0 rgb(255 255 255 / 12%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  backdrop-filter: blur(28px) saturate(160%);
}

.header-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  max-width: 75rem;
  padding: 0.25rem;
  border-radius: 9999px;
  pointer-events: auto;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  padding-inline: 0.625rem;
  border-radius: 9999px;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 9999px;
  color: #cbd5e1;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 160ms ease, color 160ms ease;
}

.header-link:hover,
.header-brand:hover,
.header-link[data-state="open"] {
  color: #fff;
  background-color: rgb(255 255 255 / 9%);
}

.header-link-active,
.header-repository {
  color: #e0e7ff;
  background-color: rgb(129 140 248 / 12%);
}

.header-desktop-repository {
  display: none;
}

.header-menu-toggle {
  justify-content: center;
  width: 2.75rem;
  padding: 0;
  background-color: rgb(255 255 255 / 6%);
}

.header-chevron {
  transition: transform 160ms ease;
}

.header-panel {
  z-index: 50;
  max-height: var(--reka-popover-content-available-height);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 1.5rem;
  outline: none;
  --tw-ring-color: transparent;
}

.header-tools-panel {
  width: min(23rem, calc(100vw - 2rem));
}

.header-mobile-panel {
  width: min(23rem, calc(100vw - 1.5rem));
}

.header-brand:focus-visible,
.header-link:focus-visible,
.header-panel a:focus-visible {
  outline: 2px solid #a5b4fc;
  outline-offset: 2px;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .header-glass {
    background: #172033;
  }
}

@media (min-width: 1024px) {
  .floating-header {
    top: max(1rem, env(safe-area-inset-top));
    padding-inline: max(1.5rem, env(safe-area-inset-left)) max(1.5rem, env(safe-area-inset-right));
  }

  .header-pill {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    padding: 0.375rem;
  }

  .header-brand {
    justify-self: start;
    gap: 0.75rem;
  }

  .header-pill .header-link {
    min-height: 2.75rem;
    padding-inline: 1rem;
    font-size: 0.875rem;
  }

  .header-desktop-repository {
    display: flex;
    justify-self: end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-link,
  .header-chevron {
    transition: none;
  }

  .header-panel {
    animation: none !important;
  }
}
</style>
