<script setup>
import { computed, ref } from "vue";

const storageKey = "atlm-color-theme";

function readTheme() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Fall back to the browser preference when storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const theme = ref(readTheme());
const nextTheme = computed(() => theme.value === "dark" ? "light" : "dark");
const label = computed(() => nextTheme.value === "dark" ? "Switch to dark theme" : "Switch to light theme");

document.documentElement.dataset.theme = theme.value;

function toggleTheme() {
  theme.value = nextTheme.value;
  document.documentElement.dataset.theme = theme.value;
  try {
    window.localStorage.setItem(storageKey, theme.value);
  } catch {
    // Keep the selected theme for the current page.
  }
}
</script>

<template>
  <button type="button" class="button theme-toggle" :aria-label="label" :title="label" @click="toggleTheme">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path v-if="nextTheme === 'dark'" d="M20.9 13.35A8.8 8.8 0 0 1 10.65 3.1 8.9 8.9 0 1 0 20.9 13.35Z" />
      <template v-else>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </template>
    </svg>
    <span class="theme-toggle-label">{{ nextTheme === "dark" ? "Dark mode" : "Light mode" }}</span>
  </button>
</template>
