<template>
  <Header />
  <main class="main">
    <div class="main__center-content">
      <img
        class="main__center-content__logo"
        src="https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_white.svg"
      />
      <div>Anthony Pillot</div>
      <div class="main__center-content__description">
        <div>Software Engineer</div>
        <div>Lille, France</div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts"></script>

<style lang="scss">
.main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 90vh;
  width: 100%;

  &__center-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    border: 5px solid;
    border-image: linear-gradient(to left, $secondary-color, #d53a9d) 5;

    padding: 1.5rem 2rem 3rem 2rem;

    &__logo {
      height: 200px;
      width: 250px;
    }

    &__description {
      display: flex;
      flex-direction: column;
      align-items: center;

      margin: 1rem 0 0 0;
    }
  }
}
</style>
