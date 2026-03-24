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
      <p class="hero__eyebrow">Portal / MVP</p>
      <h1 class="hero__headline">辣鸡小游戏测试网站</h1>
      <p class="hero__lead">
        Aetherion
        负责承载门户、展示游戏列表，并通过统一入口接入各个独立小游戏目录。
      </p>

    </div>
  </section>

  <section class="section-header" id="games">
    <div>
      <p class="section-header__eyebrow">Games</p>
      <h2>可游玩的项目</h2>
    </div>
    <p>每个游戏都有独立目录，门户只负责展示与入口管理。</p>
  </section>

  <section v-if="isLoading" class="status-panel">正在加载游戏清单...</section>
  <section v-else-if="error" class="status-panel status-panel--error">{{ error }}</section>
  <section v-else class="game-grid">
    <GameCard v-for="game in games" :key="game.slug" :game="game" />
  </section>
</template>
