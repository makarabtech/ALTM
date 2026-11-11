<script setup>
import { nextTick, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(false);
const fading = ref(false);
const minimumVisibleMs = 1000;
let activeRoute;
let minimumTimer;
let minimumWait;
let resolveMinimum;
let resolveFade;

const removeStartGuard = router.beforeEach((to, from) => {
  if (!from.matched.length || to.path === from.path) return;

  activeRoute = to;
  finishFade();
  fading.value = false;
  if (loading.value) return;

  loading.value = true;
  minimumWait = new Promise((resolve) => {
    resolveMinimum = resolve;
    minimumTimer = setTimeout(resolve, minimumVisibleMs);
  });
});

const removeResolveGuard = router.beforeResolve(async (to) => {
  if (activeRoute !== to) return;

  await minimumWait;
  await nextTick();
  if (activeRoute !== to) return;

  // Keep the backdrop visible until the card finishes fading.
  await new Promise((resolve) => {
    resolveFade = resolve;
    fading.value = true;
  });
});

function finishFade() {
  const resolve = resolveFade;
  resolveFade = undefined;
  resolve?.();
}

function resetLoader() {
  activeRoute = undefined;
  clearTimeout(minimumTimer);
  resolveMinimum?.();
  resolveMinimum = undefined;
  minimumWait = undefined;
  finishFade();
  loading.value = false;
  fading.value = false;
}

function finishNavigation(to) {
  if (activeRoute && activeRoute === to) resetLoader();
}

const removeFinishHook = router.afterEach(finishNavigation);
const removeErrorHook = router.onError((error, to) => {
  finishNavigation(to);
  console.error("ATLM navigation failed.", error);
});

onBeforeUnmount(() => {
  removeStartGuard();
  removeResolveGuard();
  removeFinishHook();
  removeErrorHook();
  resetLoader();
});
</script>

<template>
  <Teleport to="body">
    <span class="sr-only" role="status">{{ loading ? "Loading page…" : "" }}</span>
    <div v-if="loading" class="page-loader" aria-hidden="true">
      <Transition name="page-loader" @after-leave="finishFade">
        <div v-show="!fading" class="page-loader-card">
          <div class="page-loader-pitch"><span class="page-loader-ball"></span></div>
          <p>Loading page…</p>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.page-loader {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--paper);
}

.page-loader-card {
  display: grid;
  justify-items: center;
  gap: 13px;
  width: min(100%, 250px);
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 14px 40px var(--shadow);
  font-size: 14px;
  font-weight: 700;
}

.page-loader-pitch {
  position: relative;
  width: 148px;
  height: 56px;
  border: 1px solid #5c8269;
  border-radius: 9px;
  background:
    linear-gradient(#8aaa91, #8aaa91) center / 1px calc(100% - 12px) no-repeat,
    repeating-linear-gradient(90deg, #214835 0 18px, #26523c 18px 36px);
}

.page-loader-pitch::before,
.page-loader-pitch::after {
  position: absolute;
  border: 1px solid #8aaa91;
  content: "";
}

.page-loader-pitch::before {
  inset: 6px 8px;
  border-radius: 2px;
}

.page-loader-pitch::after {
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.page-loader-ball {
  position: absolute;
  z-index: 1;
  top: calc(50% - 8.5px);
  left: 13px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 49% 48%, #182e23 0 19%, transparent 21%),
    radial-gradient(circle at 16% 17%, #182e23 0 13%, transparent 15%),
    radial-gradient(circle at 88% 29%, #182e23 0 13%, transparent 15%),
    radial-gradient(circle at 41% 93%, #182e23 0 13%, transparent 15%),
    #f1f7ed;
  box-shadow: 0 1px 3px #0e211d80;
  animation: roll-ball 720ms ease-in-out infinite alternate;
}

@keyframes roll-ball {
  to { transform: translateX(102px) rotate(390deg); }
}

.page-loader-leave-active {
  transition: opacity 150ms ease;
}

.page-loader-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-loader-ball { animation: none; }
  .page-loader-leave-active { transition: none; }
}
</style>
