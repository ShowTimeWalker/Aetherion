<template>
  <Teleport to="body">
    <div v-if="show" class="auth-overlay" @click.self="close">
      <div class="auth-modal">
        <button class="auth-modal__close" @click="close">&times;</button>

        <div class="auth-modal__header">
          <span class="auth-modal__crest">A</span>
          <h2>{{ isLogin ? "欢迎回来" : "加入 Aetherion" }}</h2>
          <p>{{ isLogin ? "登录你的账户继续冒险" : "创建账户，开启你的游戏旅程" }}</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="auth-field">
            <label for="auth-username">用户名</label>
            <input
              id="auth-username"
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
              required
            />
          </div>
          <div class="auth-field">
            <label for="auth-password">密码</label>
            <input
              id="auth-password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="auth-error">{{ error }}</p>

          <button type="submit" class="auth-submit" :disabled="loading">
            {{ loading ? "请稍候…" : (isLogin ? "登 录" : "注 册") }}
          </button>
        </form>

        <div class="auth-switch">
          {{ isLogin ? "还没有账户？" : "已有账户？" }}
          <a href="#" @click.prevent="isLogin = !isLogin; error = ''">
            {{ isLogin ? "立即注册" : "去登录" }}
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const API = "http://localhost:3456";

const props = defineProps<{ show: boolean; mode?: "login" | "register" }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "loggedIn", username: string): void;
}>();

const isLogin = ref(props.mode === "register" ? false : true);
const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

watch(
  () => props.show,
  (v) => {
    if (v) {
      isLogin.value = props.mode !== "register";
      username.value = "";
      password.value = "";
      error.value = "";
    }
  }
);

function close() {
  emit("close");
}

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    const endpoint = isLogin.value ? "login" : "register";
    const res = await fetch(`${API}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });
    const data = await res.json();
    if (!res.ok) {
      error.value = data.error || "操作失败";
      return;
    }
    if (isLogin.value) {
      localStorage.setItem("aetherion_user", username.value);
      localStorage.setItem("aetherion_token", data.token);
      emit("loggedIn", username.value);
      close();
    } else {
      // Auto-login after register
      localStorage.setItem("aetherion_user", username.value);
      emit("loggedIn", username.value);
      close();
    }
  } catch {
    error.value = "无法连接到服务器，请确保后端已启动";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease;
}

.auth-modal {
  position: relative;
  width: min(420px, calc(100% - 40px));
  padding: 40px 36px 32px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface-strong);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.25s ease;
}

.auth-modal__close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s;
}
.auth-modal__close:hover {
  color: var(--danger);
}

.auth-modal__header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-modal__crest {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid var(--line-strong);
  background: linear-gradient(135deg, rgba(234, 88, 12, 0.2), rgba(252, 161, 48, 0.15), rgba(234, 88, 12, 0.2));
  font-family: "Palatino Linotype", "Times New Roman", serif;
  font-size: 1.5rem;
  color: #b45309;
  margin-bottom: 16px;
}

.auth-modal__header h2 {
  margin: 0 0 6px;
  font-family: "Palatino Linotype", "Times New Roman", serif;
  font-size: 1.4rem;
  letter-spacing: 0.04em;
  color: #2d3748;
}

.auth-modal__header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.auth-field {
  margin-bottom: 18px;
}

.auth-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.auth-field input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  color: #2d3748;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.auth-field input:focus {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.auth-field input::placeholder {
  color: #b0b8c8;
}

.auth-error {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--danger);
  font-size: 0.88rem;
}

.auth-submit {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);
}
.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin-top: 20px;
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-muted);
}
.auth-switch a {
  color: var(--accent-purple);
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
