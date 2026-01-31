<template>
  <section class="bg-slate-800 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-indigo-400">Monitoring & Analytics</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Full observability stack</p>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          Comprehensive monitoring, tracing, and analytics to understand application performance and user behavior.
        </p>
      </div>

      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <!-- SigNoz Card -->
          <a href="https://signoz.io/" target="_blank" rel="noopener" class="flex flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 hover:ring-indigo-400/50 transition-all">
            <div class="flex items-center gap-x-4 border-b border-white/10 bg-white/5 p-6">
              <NuxtImg class="h-12 w-12 rounded-lg" src="svg/icons/signoz.svg" alt="SigNoz" />
              <div>
                <h3 class="text-lg font-semibold leading-7 text-white">SigNoz APM</h3>
                <p class="text-sm text-gray-400">Application Performance Monitoring</p>
              </div>
            </div>
            <div class="p-6">
              <p class="text-base leading-7 text-gray-300">
                <span class="font-semibold text-white">OpenTelemetry-native</span> observability platform providing distributed tracing,
                metrics, and logs. Self-hosted for full data ownership and privacy.
              </p>
              <ul class="mt-4 space-y-2 text-sm text-gray-400">
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  Distributed tracing across services
                </li>
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  Real-time metrics and dashboards
                </li>
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  Error tracking and alerting
                </li>
              </ul>
            </div>
          </a>

          <!-- Matomo Card -->
          <a href="https://matomo.org/" target="_blank" rel="noopener" class="flex flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 hover:ring-indigo-400/50 transition-all">
            <div class="flex items-center gap-x-4 border-b border-white/10 bg-white/5 p-6">
              <NuxtImg class="h-12 w-12 rounded-lg" src="svg/icons/matomo.svg" alt="Matomo" />
              <div>
                <h3 class="text-lg font-semibold leading-7 text-white">Matomo Analytics</h3>
                <p class="text-sm text-gray-400">Privacy-focused Web Analytics</p>
              </div>
            </div>
            <div class="p-6">
              <p class="text-base leading-7 text-gray-300">
                <span class="font-semibold text-white">GDPR-compliant</span> analytics alternative to Google Analytics. Self-hosted to
                ensure user privacy and full data ownership.
              </p>
              <ul class="mt-4 space-y-2 text-sm text-gray-400">
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  No data sharing with third parties
                </li>
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  Real-time visitor insights
                </li>
                <li class="flex items-center gap-x-2">
                  <CheckCircleIcon class="h-5 w-5 text-indigo-400" />
                  Conversion tracking and goals
                </li>
              </ul>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
</script>
