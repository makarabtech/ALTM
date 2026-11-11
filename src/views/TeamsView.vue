<script setup>
import { computed } from "vue";
import TeamBadge from "../components/TeamBadge.vue";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({ tournament: { type: Object, required: true } });
const emit = defineEmits(["open"]);
const store = useWorkspaceStore();
const registered = computed(() => props.tournament.registeredTeamIds.map((id) => store.teamsById.get(id)).filter(Boolean));
const available = computed(() => store.isManager
  ? store.workspace.teams.filter((team) => team.managed && !props.tournament.registeredTeamIds.includes(team.id))
  : []);
const groups = computed(() => [
  { label: "Registered teams", teams: registered.value, entered: true },
  ...(available.value.length ? [{ label: "My other teams", teams: available.value, entered: false }] : []),
]);
</script>

<template>
  <div class="section-head">
    <div>
      <span class="eyebrow">{{ tournament.name }}</span>
      <h1>Teams</h1>
      <p class="muted">{{ tournament.generated ? "Registration closed when fixtures were generated." : "Register at least two teams to generate fixtures." }}</p>
    </div>
    <button v-if="store.isManager" type="button" class="button primary" @click="emit('open', 'team')">＋ Create team</button>
    <button
      v-else-if="store.isOrganizer && !tournament.generated"
      type="button"
      class="button primary"
      :disabled="registered.length < 2"
      @click="emit('open', 'generate')"
    >Generate fixtures</button>
  </div>
  <section v-for="group in groups" :key="group.label" class="mb-5" :aria-label="group.label">
    <h2 v-if="!group.entered" class="mb-2 text-lg font-bold">{{ group.label }}</h2>
    <div v-if="!group.teams.length" class="panel empty">
      <h3>No teams registered yet</h3>
      <p class="muted">Choose the Team Manager demo role to register a team.</p>
    </div>
    <div v-else class="team-grid">
      <article v-for="team in group.teams" :key="team.id" class="team-card">
        <h3><TeamBadge :id="team.id" /></h3>
        <p class="muted">{{ team.players.length }} {{ team.players.length === 1 ? "player" : "players" }} · {{ group.entered ? "Registered" : "Team directory" }}</p>
        <div class="actions">
          <button type="button" class="button small" @click="emit('open', 'roster', team.id)">
            {{ store.isManager && team.managed ? "Manage roster" : "View roster" }}
          </button>
          <button
            v-if="store.isManager && team.managed && !group.entered && !tournament.generated"
            type="button"
            class="button small primary"
            @click="emit('open', 'register', team.id)"
          >Register team</button>
        </div>
      </article>
    </div>
  </section>
</template>
