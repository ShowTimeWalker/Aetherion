<template>
  <div class="shell">
    <header class="topbar">
      <router-link class="brand" to="/">
        <span class="brand__crest">A</span>
        <span>
          <strong>Aetherion</strong>
          <small>Arcade Gateway</small>
        </span>
      </router-link>

      <nav class="topbar__nav">
        <a href="#overview">平台概览</a>
        <a href="#games">游戏列表</a>
      </nav>
    </header>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
