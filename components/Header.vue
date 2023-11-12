<template>
  <header class="header">
    <div class="header__left">
      <div class="header__item">anthonypillotOS</div>
    </div>
    <div class="header__center">
      <NuxtLink class="header__item" to="/">Home</NuxtLink>
      <!-- <NuxtLink class="header__item" to="/about">About me</NuxtLink> -->
      <NuxtLink class="header__item" to="https://github.com/size-up" rel="noopener" target="_blank">Organization</NuxtLink>
      <NuxtLink class="header__item" to="https://docs.sizeup.cloud" rel="noopener" target="_blank">Documentation</NuxtLink>
    </div>
    <div class="header__right">
      <NuxtLink class="header__item" to="https://github.com/anthonypillot/anthonypillotOS" rel="noopener" target="_blank">GitHub</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.header {
  display: flex;
  flex-direction: row;
  align-items: center;

  background-color: #303030;

  font-size: 0.8rem;

  &__left {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;

    width: 100%;
  }

  &__center {
    display: flex;
    flex-direction: row;
    justify-content: center;

    width: 100%;
  }

  &__right {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    width: 100%;
  }

  &__item {
    padding: 0.5rem 0.25rem 0.5rem 0.25rem;
  }

  &__item:hover {
    color: #000;
    background-color: #fff;

    transition: all 0.2s ease-in-out;
  }
}
</style>
