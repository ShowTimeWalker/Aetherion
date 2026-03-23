<script setup lang="ts">
import type { GameEntry } from "../game-manifest";

defineProps<{
  game: GameEntry;
}>();
</script>

<template>
  <article class="game-card">
    <div
      class="game-card__visual"
      :style="game.cover ? { backgroundImage: `url(${game.cover})` } : undefined"
    >
      <span v-if="!game.cover" class="game-card__monogram">
        {{ game.title.slice(0, 1) }}
      </span>
    </div>

    <div class="game-card__body">
      <p class="game-card__eyebrow">Game Portal</p>
      <h3>{{ game.title }}</h3>
      <p class="game-card__description">{{ game.description }}</p>
      <router-link class="game-card__action" :to="`/play/${game.slug}`">
        进入游戏
      </router-link>
    </div>
  </article>
</template>

