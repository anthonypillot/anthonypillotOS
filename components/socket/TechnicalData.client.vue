<template>
  <section>
    <h1 class="text-3xl font-bold text-white sm:text-4xl">Technical</h1>
    <p class="text-gray-400">
      Connection status: <span class="text-white">{{ props.isConnected ? "🟢" : "🔴" }}</span>
    </p>
    <p class="text-gray-400">
      Transport: <span class="text-white">{{ props.transport }}</span>
    </p>
    <p v-if="props.socket" class="text-gray-400">
      Socket ID: <span class="text-white">{{ props.socket.id || "N/A" }}</span>
    </p>
    <p v-if="props.socket" class="text-gray-400">
      Socket state: <span class="text-white">{{ props.socket.active ? "active" : "inactive" }}</span>
    </p>
    <p class="text-gray-400">
      Socket number: <span class="text-white">{{ props.socketNumber || "N/A" }}</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Socket } from "socket.io-client";

const props = defineProps<{
  isConnected: boolean;
  transport: string;
  socket: Socket | null;
  socketNumber: number | null;
}>();
</script>
