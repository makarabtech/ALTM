<script setup>
import { computed, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import ThemeToggle from "../components/ThemeToggle.vue";
import { isAdminSession, regularHome } from "../router/adminHome.js";
import { useAuthStore } from "../stores/auth.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const router = useRouter();
const auth = useAuthStore();
const store = useWorkspaceStore();

const admin = computed(() => isAdminSession(auth));
const accountName = computed(() => auth.user?.name || auth.user?.email || "ATLM account");
const competitions = computed(() => store.workspace?.tournaments ?? []);
const leagueCount = computed(() => competitions.value.filter(({ format }) => format === "league").length);
const cupCount = computed(() => competitions.value.filter(({ format }) => format === "knockout").length);

watch(admin, (allowed) => {
  if (!allowed) return router.replace(regularHome(auth));
  if (!store.workspace && !store.loading) return store.load();
}, { immediate: true });
</script>

<template>
  <div v-if="admin" class="admin-home">
    <header class="admin-header">
      <div class="admin-topbar">
        <RouterLink to="/" class="admin-brand" aria-label="ATLM home">
          <img src="/mark.svg" width="36" height="36" alt="" />
          <span>ATLM</span>
        </RouterLink>

        <div class="admin-account-actions">
          <div class="admin-account">
            <strong>{{ accountName }}</strong>
            <span>Administrator</span>
          </div>
          <ThemeToggle />
          <button type="button" class="button" @click="auth.signOut()">Sign out</button>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <h1>Admin dashboard</h1>

      <dl v-if="store.workspace && !store.loading && !store.error" class="admin-stats">
        <div class="admin-stat">
          <dt>Competitions</dt>
          <dd>{{ competitions.length }}</dd>
        </div>
        <div class="admin-stat">
          <dt>Leagues</dt>
          <dd>{{ leagueCount }}</dd>
        </div>
        <div class="admin-stat">
          <dt>Knockout cups</dt>
          <dd>{{ cupCount }}</dd>
        </div>
      </dl>

      <section class="admin-panel" aria-labelledby="admin-competitions">
        <h2 id="admin-competitions">Workspace competitions</h2>

        <div v-if="store.error" class="admin-status" role="alert">
          <p>{{ store.error }}</p>
          <button type="button" class="button" @click="store.load()">Retry</button>
        </div>
        <p v-else-if="store.loading || !store.workspace" class="admin-status" role="status">
          Loading competitions…
        </p>
        <p v-else-if="competitions.length === 0" class="admin-status">
          This workspace has no competitions yet.
        </p>
        <div v-else class="admin-table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Format</th>
                <th scope="col">Workspace</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="competition in competitions" :key="competition.id">
                <th scope="row">{{ competition.name }}</th>
                <td>{{ competition.format === "knockout" ? "Cup" : "League" }}</td>
                <td>
                  <RouterLink
                    class="admin-competition-link"
                    :to="{ name: 'competition', params: { tournamentId: competition.id } }"
                    :aria-label="'Open ' + competition.name"
                  >
                    Open <span aria-hidden="true">↗</span>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-home {
  --admin-line: color-mix(in srgb, currentColor 15%, transparent);
  --admin-surface: color-mix(in srgb, currentColor 4%, transparent);
  --admin-muted: color-mix(in srgb, currentColor 72%, transparent);
  min-height: 100dvh;
}

.admin-header {
  border-bottom: 1px solid var(--admin-line);
}

.admin-topbar,
.admin-main {
  width: min(100% - 2rem, 68rem);
  margin-inline: auto;
}

.admin-topbar,
.admin-account-actions,
.admin-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-topbar {
  justify-content: space-between;
  flex-wrap: wrap;
  min-height: 4.25rem;
  padding-block: 0.625rem;
}

.admin-brand {
  color: inherit;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-decoration: none;
}

.admin-account-actions {
  flex-wrap: wrap;
}

.admin-account {
  display: grid;
  min-width: 0;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

.admin-account span,
.admin-stat dt,
.admin-table thead th {
  color: var(--admin-muted);
  font-size: 0.875rem;
}

.admin-main {
  padding-block: clamp(1.5rem, 4vw, 3rem);
}

.admin-main h1 {
  margin: 0 0 1.25rem;
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.5rem, 2vw, 1rem);
  margin: 0 0 1.5rem;
}

.admin-stat,
.admin-panel {
  border: 1px solid var(--admin-line);
  border-radius: 1rem;
}

.admin-stat {
  padding: clamp(0.75rem, 2.5vw, 1.25rem);
  background: var(--admin-surface);
}

.admin-stat dd {
  margin: 0.25rem 0 0;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 750;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.admin-panel h2 {
  margin: 0;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
}

.admin-status {
  margin: 0;
  padding: 0.5rem 1rem 1rem;
}

.admin-status p {
  margin: 0 0 0.75rem;
}

.admin-table-scroll {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: start;
}

.admin-table :is(th, td) {
  padding: 0.75rem clamp(0.5rem, 2vw, 1rem);
  border-top: 1px solid var(--admin-line);
  text-align: start;
}

.admin-table thead {
  background: var(--admin-surface);
}

.admin-table tbody th {
  overflow-wrap: anywhere;
  font-weight: 650;
}

.admin-competition-link {
  color: inherit;
  font-weight: 650;
  white-space: nowrap;
  text-underline-offset: 0.2em;
}
</style>

