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
      <h1 class="hero__headline">小游戏统一门户</h1>
      <p class="hero__lead">
        Aetherion
        负责承载门户、展示游戏列表，并通过统一入口接入各个独立小游戏目录。
      </p>

      <div class="hero__actions">
        <a href="#games">查看游戏</a>
        <span>域名上线后可直接挂在 noah-bot.cloud</span>
      </div>
    </div>

    <div class="hero__panel">
      <p>当前定位</p>
      <ul>
        <li>Vite + Vue 3 + TypeScript 门户</li>
        <li>`games/` 独立静态游戏目录</li>
        <li>构建前自动扫描并生成清单</li>
        <li>适配 GitHub Actions 自动部署</li>
      </ul>
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
