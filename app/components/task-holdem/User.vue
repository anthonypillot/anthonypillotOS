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
          <UButton label="Remove" variant="outline" size="sm" class="text-white mt-2" @click="remove(user)" />
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
