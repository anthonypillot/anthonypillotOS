<template>
  <section>
    <div class="flex flex-col gap-y-8">
      <div class="flex flex-col gap-y-4 items-start">
        <div>
          <p class="text-white text-lg">User informations</p>
          <DevOnly>
            <p class="text-gray-400">
              ID: <span class="text-white">{{ user.id }}</span>
            </p>
          </DevOnly>
          <p class="text-gray-400">
            Name: <span class="text-white">{{ user.name }}</span>
          </p>
          <button
            class="text-white text-sm border border-white rounded-md mt-2 px-2 py-1 cursor-pointer hover:bg-white hover:text-black"
            @click="remove(user)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { User } from "@/components/task-holdem/CreateUser.vue";

defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  remove: [User];
}>();

function remove(user: User): void {
  emit("remove", user);
}
</script>
