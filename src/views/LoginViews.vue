<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import { authApiConfigured } from "../api/auth.js";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const waiting = ref(false);
const error = ref("");

async function signIn() {
  if (waiting.value) return;
  waiting.value = true;
  error.value = "";
  try {
    await auth.signIn({ email: email.value, password: password.value });
    password.value = "";
    await router.replace("/");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Could not sign in. Try again.";
  } finally {
    waiting.value = false;
  }
}

function openDemo() {
  auth.enterDemo();
  router.replace("/");
}
</script>

<template>
  <AuthLayout>
    <section class="login-panel" aria-labelledby="signin-title">
      <span class="eyebrow">ATLM account</span>
      <h1 id="signin-title">Sign in</h1>
      <p class="muted">
        {{ authApiConfigured ? "Use your ATLM account to open your workspace." : "Sign in with a demo account created in this browser." }}
      </p>

      <form class="login-form" :aria-busy="waiting" @submit.prevent="signIn">
        <label for="login-email">Email address</label>
        <input id="login-email" v-model.trim="email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required />

        <label for="login-password">Password</label>
        <input id="login-password" v-model="password" name="password" type="password" autocomplete="current-password" required />

        <p v-if="error" class="login-error" role="alert">{{ error }}</p>
        <button class="button primary login-submit" type="submit" :disabled="waiting">
          {{ waiting ? "Signing in…" : "Sign in" }}
        </button>
      </form>

      <p class="login-account-link">
        New to ATLM? <RouterLink :to="{ name: 'register' }">Create an account</RouterLink>
      </p>

      <div class="login-demo">
        <p class="muted">Try the Organizer, Team Manager, and Viewer screens with sample data.</p>
        <button type="button" class="button" :disabled="waiting" @click="openDemo">Open demo <span aria-hidden="true">→</span></button>
      </div>
    </section>
  </AuthLayout>
</template>
