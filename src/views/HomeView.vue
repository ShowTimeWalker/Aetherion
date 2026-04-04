<script setup lang="ts">
import { onMounted, ref } from "vue";

import GameCard from "../components/GameCard.vue";
import { loadGames, type GameEntry } from "../game-manifest";

const games = ref<GameEntry[]>([]);
const isLoading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    games.value = await loadGames();
  } catch (caughtError) {
    error.value =
      caughtError instanceof Error ? caughtError.message : "加载游戏清单失败。";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="hero" id="overview">
    <div class="hero__copy">
      <p class="hero__eyebrow">🎮 欢迎来到</p>
      <h1 class="hero__headline">Aetherion 游戏世界</h1>
      <p class="hero__lead">
        在这里探索各种有趣的小游戏，放松一下吧！✨<br />
        每一个游戏都是一次小小的冒险，等你来发现。
      </p>
      <p class="hero__eyebrow">Deployment test build: 2026-03-25 10:10 CST</p>
    </div>
  </section>

  <section class="section-header" id="games">
    <div>
      <p class="section-header__eyebrow">Games</p>
      <h2>可游玩的项目</h2>
    </div>
  </section>

  <section v-if="isLoading" class="status-panel">正在加载游戏清单...</section>
  <section v-else-if="error" class="status-panel status-panel--error">{{ error }}</section>
  <section v-else class="game-grid">
    <GameCard v-for="game in games" :key="game.slug" :game="game" />
  </section>
</template>
