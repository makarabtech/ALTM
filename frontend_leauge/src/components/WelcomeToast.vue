<script setup>
import { watch } from "vue";
import { useWelcomeToastStore } from "../stores/welcome.js";

const welcomeToast = useWelcomeToastStore();

watch(
  () => welcomeToast.notice,
  (notice, _, onCleanup) => {
    if (!notice) return;

    const timer = setTimeout(() => welcomeToast.dismiss(), 10000);
    onCleanup(() => clearTimeout(timer));
  },
  { immediate: true, flush: "sync" },
);
</script>

<template>
  <Teleport to="body">
    <div class="welcome-toast-host">
      <span class="welcome-toast-announcement" role="status" aria-atomic="true">
        {{ welcomeToast.notice ? welcomeToast.notice.title + " " + welcomeToast.notice.detail : "" }}
      </span>

      <Transition name="welcome">
        <div v-if="welcomeToast.notice" class="welcome-toast">
          <span class="welcome-toast-icon" aria-hidden="true">✓</span>

          <div class="welcome-toast-content" aria-hidden="true">
            <p class="welcome-toast-title">{{ welcomeToast.notice.title }}</p>
            <p class="welcome-toast-detail">{{ welcomeToast.notice.detail }}</p>
          </div>

          <button
            type="button"
            class="welcome-toast-dismiss"
            aria-label="Dismiss welcome message"
            @click="welcomeToast.dismiss()"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.welcome-toast-host {
  position: fixed;
  z-index: 1000;
  inset-block-start: max(1rem, env(safe-area-inset-top));
  inset-inline-end: 1rem;
  width: min(24rem, calc(100% - 2rem));
  pointer-events: none;
}

.welcome-toast-announcement {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.welcome-toast {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) 2.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #334155;
  border-radius: 0.875rem;
  background: #0f172a;
  color: #f8fafc;
  box-shadow: 0 12px 30px rgb(15 23 42 / 22%);
  pointer-events: auto;
}

.welcome-toast-icon {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 50%;
  background: #064e3b;
  color: #a7f3d0;
  font-size: 1rem;
  font-weight: 700;
}

.welcome-toast-content {
  overflow-wrap: anywhere;
}

.welcome-toast-title,
.welcome-toast-detail {
  margin: 0;
  line-height: 1.4;
}

.welcome-toast-title {
  font-weight: 700;
}

.welcome-toast-detail {
  margin-block-start: 0.125rem;
  color: #cbd5e1;
  font-size: 0.875rem;
}

.welcome-toast-dismiss {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #cbd5e1;
  font: inherit;
  font-size: 1.375rem;
  line-height: 1;
  cursor: pointer;
}

.welcome-toast-dismiss:hover {
  background: #1e293b;
  color: #fff;
}

.welcome-toast-dismiss:focus-visible {
  outline: 2px solid #6ee7b7;
  outline-offset: 2px;
}

.welcome-enter-active,
.welcome-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem);
}

@media (prefers-reduced-motion: reduce) {
  .welcome-enter-active,
  .welcome-leave-active {
    transition: none;
  }
}
</style>

