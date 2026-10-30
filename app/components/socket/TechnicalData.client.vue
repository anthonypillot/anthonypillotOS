<template>
  <section>
    <h1 class="text-3xl font-bold text-highlighted sm:text-4xl">Technical</h1>
    <p class="text-muted">
      Connection status: <span class="text-highlighted">{{ isConnected ? "🟢" : "🔴" }}</span>
    </p>
    <p class="text-muted">
      Transport: <span class="text-highlighted">{{ transport }}</span>
    </p>
    <p v-if="socket" class="text-muted">
      Socket ID: <span class="text-highlighted">{{ socket.id || "N/A" }}</span>
    </p>
    <p v-if="socket" class="text-muted">
      Socket state: <span class="text-highlighted">{{ socket.active ? "active" : "inactive" }}</span>
    </p>
    <p class="text-muted">
      Socket number: <span class="text-highlighted">{{ socketNumber || "N/A" }}</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Socket } from "socket.io-client";

defineProps<{
  isConnected: boolean;
  transport: string;
  socket: Socket | null;
  socketNumber: number | null;
}>();
</script>
