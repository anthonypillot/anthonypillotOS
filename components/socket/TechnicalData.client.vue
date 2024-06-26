<template>
  <section>
    <h1 class="text-3xl font-bold text-white sm:text-4xl">Technical</h1>
    <p class="text-gray-400">
      Status: <span class="text-white">{{ store.isConnected ? "connected" : "disconnected" }}</span>
    </p>
    <p class="text-gray-400">
      Transport: <span class="text-white">{{ store.transport }}</span>
    </p>
    <p class="text-gray-400">
      Socket ID: <span class="text-white">{{ store.socket.id }}</span>
    </p>
    <p class="text-gray-400">
      Socket state: <span class="text-white">{{ store.socket.active ? "active" : "inactive" }}</span>
    </p>
    <p class="text-gray-400">
      Socket number: <span class="text-white">{{ store.data.socketNumber }}</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { useTaskHoldemStore } from "@/stores/task-holdem.store";

const store = useTaskHoldemStore();
</script>
