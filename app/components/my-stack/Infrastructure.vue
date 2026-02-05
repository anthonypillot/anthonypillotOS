<template>
  <section class="bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-indigo-400">Infrastructure</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Production-grade deployment</p>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          Running on Kubernetes with custom GitHub Actions CI/CD pipelines. Every deployment is automated, tested, and monitored.
        </p>
      </div>

      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          <!-- Kubernetes -->
          <div class="relative pl-16">
            <dt class="text-base font-semibold leading-7 text-white">
              <a href="https://kubernetes.io/" target="_blank" rel="noopener" class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors">
                <NuxtImg class="h-6 w-6" src="svg/icons/kubernetes.svg" alt="Kubernetes" />
              </a>
              <a href="https://kubernetes.io/" target="_blank" rel="noopener" class="hover:text-indigo-400 transition-colors">Kubernetes Orchestration</a>
            </dt>
            <dd class="mt-2 text-base leading-7 text-gray-300">
              The entire application runs on a self-managed Kubernetes cluster. Deployments, services, and ingress are all configured for
              high availability and automatic scaling.
            </dd>
          </div>

          <!-- Docker -->
          <div class="relative pl-16">
            <dt class="text-base font-semibold leading-7 text-white">
              <a href="https://www.docker.com/" target="_blank" rel="noopener" class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors">
                <NuxtImg class="h-6 w-6" src="svg/icons/docker.svg" alt="Docker" />
              </a>
              <a href="https://www.docker.com/" target="_blank" rel="noopener" class="hover:text-indigo-400 transition-colors">Containerized with Docker</a>
            </dt>
            <dd class="mt-2 text-base leading-7 text-gray-300">
              Multi-stage Docker builds with distroless Node.js images for minimal attack surface. Optimized for fast builds and small
              image sizes.
            </dd>
          </div>

          <!-- GitHub Actions -->
          <div class="relative pl-16">
            <dt class="text-base font-semibold leading-7 text-white">
              <a href="https://github.com/features/actions" target="_blank" rel="noopener" class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors">
                <NuxtImg class="h-6 w-6" src="svg/icons/github.svg" alt="GitHub Actions" style="filter: invert(1)" />
              </a>
              <a href="https://github.com/features/actions" target="_blank" rel="noopener" class="hover:text-indigo-400 transition-colors">Custom GitHub Actions CI/CD</a>
            </dt>
            <dd class="mt-2 text-base leading-7 text-gray-300">
              Hand-crafted reusable workflows and composite actions. Automated testing, building, pushing to container registry, and
              deploying to Kubernetes on every PR and release.
            </dd>
          </div>

          <!-- Semantic Release -->
          <div class="relative pl-16">
            <dt class="text-base font-semibold leading-7 text-white">
              <a href="https://semantic-release.gitbook.io/" target="_blank" rel="noopener" class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors">
                <TagIcon class="h-6 w-6 text-white" aria-hidden="true" />
              </a>
              <a href="https://semantic-release.gitbook.io/" target="_blank" rel="noopener" class="hover:text-indigo-400 transition-colors">Semantic Versioning</a>
            </dt>
            <dd class="mt-2 text-base leading-7 text-gray-300">
              Automated versioning with semantic-release based on conventional commits. Changelogs are generated automatically, and
              releases are published to GitHub.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TagIcon } from "@heroicons/vue/24/outline";
</script>
