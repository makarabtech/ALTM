<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import { authApiConfigured, registerAccount } from "../api/auth.js";
import { roleLabels } from "../stores/auth.js";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmation = ref("");
const role = ref("viewer");
const waiting = ref(false);
const created = ref(false);
const error = ref("");

async function register() {
  if (waiting.value || created.value) return;
  error.value = "";
  if (!name.value) {
    error.value = "Enter your full name.";
    return;
  }
  if (password.value !== confirmation.value) {
    error.value = "Passwords do not match.";
    return;
  }

  waiting.value = true;
  try {
    await registerAccount({ name: name.value, email: email.value, password: password.value, role: role.value });
    password.value = "";
    confirmation.value = "";
    created.value = true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Could not create the account. Try again.";
  } finally {
    waiting.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <section class="login-panel" aria-labelledby="register-title">
      <span class="eyebrow">ATLM account</span>
      <div aria-live="polite">
        <h1 id="register-title">{{ created ? "Account created" : "Create an account" }}</h1>
        <p v-if="created" class="muted">Sign in with your new account to open your workspace.</p>
        <p v-else-if="authApiConfigured" class="muted">Enter your details to register for ATLM.</p>
        <p v-else class="muted">Use a test email and password. Your demo account stays in this browser.</p>
      </div>

      <div v-if="created" class="login-demo">
        <RouterLink :to="{ name: 'login' }" class="button primary">Go to sign in</RouterLink>
      </div>
      <template v-else>
        <form class="login-form" :aria-busy="waiting" @submit.prevent="register">
          <fieldset class="grid min-w-0 gap-2" :disabled="waiting">
            <label for="register-name">Full name</label>
            <input id="register-name" v-model.trim="name" name="name" autocomplete="name" required />

            <label for="register-email">Email address</label>
            <input id="register-email" v-model.trim="email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required />

            <label for="register-password">Password</label>
            <input id="register-password" v-model="password" name="password" type="password" autocomplete="new-password" required />

            <label for="register-confirmation">Confirm password</label>
            <input id="register-confirmation" v-model="confirmation" name="confirmation" type="password" autocomplete="new-password" required />


            <label for="register-role">Account type</label>

<select id="register-role" v-model="role" name="role" required>
  <option value="viewer">Viewer</option>
  <option value="manager">Manager</option>
  <option value="ornizer">Organizer</option>
</select>

          </fieldset>

          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <button class="button primary login-submit" type="submit" :disabled="waiting">
            {{ waiting ? "Creating account…" : "Create account" }}
          </button>
        </form>

        <p class="login-account-link">
          Already have an account? <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
        </p>
      </template>
    </section>
  </AuthLayout>
</template>
