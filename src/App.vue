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
        <div class="topbar__auth">
          <template v-if="loggedInUser">
            <span class="topbar__user">
              <span class="topbar__avatar">{{ loggedInUser[0].toUpperCase() }}</span>
              {{ loggedInUser }}
            </span>
            <button class="topbar__logout" @click="logout">退出</button>
          </template>
          <template v-else>
            <button class="topbar__btn" @click="openAuth('login')">登录</button>
            <button class="topbar__btn topbar__btn--accent" @click="openAuth('register')">注册</button>
          </template>
        </div>
      </nav>
    </header>

    <main class="main">
      <router-view />
    </main>

    <AuthModal
      :show="authModalVisible"
      :mode="authMode"
      @close="authModalVisible = false"
      @loggedIn="onLoggedIn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AuthModal from "./components/AuthModal.vue";

const loggedInUser = ref(localStorage.getItem("aetherion_user") || "");
const authModalVisible = ref(false);
const authMode = ref<"login" | "register">("login");

onMounted(() => {
  // Validate token on mount
  const token = localStorage.getItem("aetherion_token");
  const user = localStorage.getItem("aetherion_user");
  if (token && user) {
    // Simple token check: decode and verify it's recent-ish (within 30 days)
    try {
      const payload = JSON.parse(atob(token));
      if (payload.username !== user || Date.now() - payload.ts > 30 * 24 * 60 * 60 * 1000) {
        logout();
      }
    } catch {
      logout();
    }
  }
});

function openAuth(mode: "login" | "register") {
  authMode.value = mode;
  authModalVisible.value = true;
}

function onLoggedIn(username: string) {
  loggedInUser.value = username;
}

function logout() {
  loggedInUser.value = "";
  localStorage.removeItem("aetherion_user");
  localStorage.removeItem("aetherion_token");
}
</script>
