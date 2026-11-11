<script setup>
import { computed, shallowRef, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "./stores/workspace.js";
import { roleLabels, useAuthStore } from "./stores/auth.js";
import ActionDialog from "./components/ActionDialog.vue";
import AppIcon from "./components/AppIcon.vue";
import PageLoader from "./components/PageLoader.vue";
import ThemeToggle from "./components/ThemeToggle.vue";

const route = useRoute();
const router = useRouter();
const store = useWorkspaceStore();
const auth = useAuthStore();
const inWorkspace = computed(() => route.meta.workspace === true);
const accountName = computed(() => auth.user?.name || auth.user?.email || "ATLM account");
const dialog = shallowRef(null);
const tournament = computed(() => store.workspace?.tournaments.find(({ id }) => id === route.params.tournamentId));
const tabs = computed(() => [
  { name: "overview", label: "Overview", icon: "overview" },
  { name: "teams", label: "Teams", icon: "teams" },
  { name: "fixtures", label: "Fixtures", icon: "fixtures" },
  { name: "outcome", label: tournament.value?.format === "knockout" ? "Bracket" : "Standings", icon: tournament.value?.format === "knockout" ? "bracket" : "standings" },
]);

function open(kind, id) {
  dialog.value = { kind, id };
}

function showPage(name, tournamentId) {
  dialog.value = null;
  router.push({ name, params: { tournamentId } });
}

function signOut() {
  auth.signOut();
  router.replace({ name: "login" });
}

watch(() => route.params.tournamentId, () => { dialog.value = null; });
watch(inWorkspace, (active) => {
  if (active && !store.workspace && !store.loading) store.load();
}, { immediate: true });
</script>

<template>
  <PageLoader />
  <RouterView v-if="!inWorkspace" />
  <div v-else class="shell">
    <a href="#main" class="skip">Skip to content</a>
    <aside class="sidebar" aria-label="Workspace">
      <RouterLink to="/" class="brand no-underline text-inherit">
        <img src="/mark.svg" width="40" height="40" alt="" />
        <div><strong>ATLM</strong><small>Competition manager</small></div>
      </RouterLink>
      <nav v-if="tournament" aria-label="Competition sections">
        <span class="eyebrow">Manage</span>
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          class="nav-button"
          :to="{ name: tab.name, params: { tournamentId: tournament.id } }"
          :aria-current="route.name === tab.name ? 'page' : undefined"
        >
          <AppIcon :name="tab.icon" />{{ tab.label }}
        </RouterLink>
      </nav>
      <nav aria-label="Competitions">
        <span class="eyebrow">Competitions</span>
        <RouterLink
          v-for="item in store.workspace?.tournaments"
          :key="item.id"
          :to="{ name: 'competition', params: { tournamentId: item.id } }"
          class="nav-button"
          :aria-current="item.id === tournament?.id ? 'true' : undefined"
        >
          <span :class="['mini-tag', { cup: item.format === 'knockout' }]" aria-hidden="true">
            {{ item.format === "league" ? "L" : "K" }}
          </span>
          <span class="truncated" :title="item.name">{{ item.name }}</span>
        </RouterLink>
      </nav>
      <div class="local-note">
        <span aria-hidden="true"></span>
        <div><strong>{{ auth.demo ? "Frontend demo" : "Signed-in workspace" }}</strong><small>Sample league data on this device</small></div>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <p class="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>Competitions</strong></p>
        <div class="top-actions">
          <label v-if="auth.demo" class="role">
            <span>Demo role</span>
            <select v-model="store.demoRole" @change="showPage('competition', route.params.tournamentId)">
              <option value="organizer">Organizer</option>
              <option value="manager">Team Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <div v-else-if="auth.user" class="account-badge" :title="accountName">
            <strong>{{ accountName }}</strong><span>{{ roleLabels[auth.user.role] }}</span>
          </div>
          <ThemeToggle />
          <button v-if="store.isOrganizer && tournament" type="button" class="button primary" @click="open('tournament')">
            ＋ <span>New competition</span>
          </button>
          <button type="button" class="button" @click="signOut">{{ auth.demo ? "Exit demo" : "Sign out" }}</button>
        </div>
      </header>
      <main id="main" tabindex="-1">
        <div v-if="store.error" class="panel empty" role="alert">
          <h1>Workspace unavailable</h1>
          <p class="muted">{{ store.error }}</p>
          <button type="button" class="button" @click="store.load">Retry</button>
        </div>
        <div v-else-if="store.loading || !store.workspace" class="panel empty" role="status">Loading competitions…</div>
        <div v-else-if="!tournament" class="panel empty">
          <h1>Competition unavailable</h1>
          <p class="muted">Choose a competition from the sidebar or return to the sample league.</p>
          <RouterLink to="/" class="button">Open sample league</RouterLink>
        </div>
        <template v-else>
          <p v-if="!store.workspace.storageAvailable" class="demo-storage muted" role="status">
            Browser storage is unavailable. Changes last for this session.
          </p>
          <RouterView v-slot="{ Component }">
            <component :is="Component" :key="tournament.id" :tournament="tournament" @open="open" />
          </RouterView>
        </template>
      </main>
    </div>
  </div>
  <ActionDialog
    v-if="inWorkspace && dialog && tournament"
    :tournament="tournament"
    :kind="dialog.kind"
    :id="dialog.id"
    @close="dialog = null"
    @navigate="showPage"
  />
</template>
