<template>
  <div
    :class="
      'card flex flex-col justify-center items-center w-12 h-24 border border-indigo-400 rounded cursor-pointer transform hover:bg-indigo-400 hover:bg-opacity-10' +
      (isSelected ? ' bg-indigo-200 bg-opacity-10 border-indigo-600 border-4 -translate-y-1' : '')
    "
    @click="select()"
  >
    <component v-if="props.type === 'icon'" :is="valueToComponent[props.value]" class="text-white" />
    <span v-else class="text-white text-xl">{{ props.value }}</span>
  </div>
</template>

<script setup lang="ts">
import { valueToComponent } from "@/types/task-holdem.type";

export type Card = {
  type: "number" | "icon";
  value: number | "skip" | "break";
  isSelected: boolean;
};

const props = defineProps<Card>();

const emit = defineEmits<{
  select: [card: Card];
}>();

function select(): void {
  emit("select", props);
}
</script>

<style scoped>
.card {
  transition: transform 0.15s;
}

.card:hover {
  transform: translateY(-0.25rem);
}
</style>
