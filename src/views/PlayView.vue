<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { loadGame, type GameEntry } from "../game-manifest";

const route = useRoute();
const game = ref<GameEntry | null>(null);
const isLoading = ref(true);
const error = ref("");

const slug = computed(() => String(route.params.slug ?? ""));

async function hydrateGame() {
  isLoading.value = true;
  error.value = "";

  try {
    const currentGame = await loadGame(slug.value);

    if (!currentGame) {
      throw new Error("没有找到对应的小游戏。");
    }

    game.value = currentGame;
  } catch (caughtError) {
    game.value = null;
    error.value =
      caughtError instanceof Error ? caughtError.message : "加载游戏失败。";
  } finally {
    isLoading.value = false;
  }
}

onMounted(hydrateGame);
watch(slug, hydrateGame);
</script>

<template>
  <section class="play-shell">
    <RouterLink class="play-shell__back" to="/">返回门户</RouterLink>

    <div v-if="isLoading" class="status-panel">正在启动游戏...</div>
    <div v-else-if="error" class="status-panel status-panel--error">{{ error }}</div>
    <template v-else-if="game">
      <header class="play-shell__header">
        <div>
          <p class="section-header__eyebrow">Now Playing</p>
          <h1>{{ game.title }}</h1>
          <p>{{ game.description }}</p>
        </div>

        <a class="play-shell__link" :href="game.playUrl" target="_blank" rel="noreferrer">
          新窗口打开
        </a>
      </header>

      <div class="play-shell__frame">
        <iframe :src="game.playUrl" :title="game.title" loading="lazy"></iframe>
      </div>
    </template>
  </section>
</template>

