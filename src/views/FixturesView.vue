<script setup>
import { computed, ref } from "vue";
import MatchRow from "../components/MatchRow.vue";
import { roundLabel } from "../format.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({ tournament: { type: Object, required: true } });
const emit = defineEmits(["open"]);
const store = useWorkspaceStore();
const selected = ref(null);
const rounds = computed(() => Array.from({ length: props.tournament.roundCount }, (_, i) => i + 1));
const round = computed(() => selected.value ?? props.tournament.matches.find(({ status }) => ["scheduled", "in progress"].includes(status))?.round ?? 1);
const matches = computed(() => props.tournament.matches.filter((match) => match.round === round.value));
</script>

<template>
  <div class="section-head">
    <div>
      <span class="eyebrow">{{ tournament.name }}</span>
      <h1>Fixtures</h1>
      <p class="muted">Browse the generated rounds and recorded results.</p>
    </div>
    <button
      v-if="store.isOrganizer && !tournament.generated"
      type="button"
      class="button primary"
      :disabled="tournament.registeredTeamIds.length < 2"
      @click="emit('open', 'generate')"
    >Generate fixtures</button>
  </div>
  <template v-if="tournament.generated">
    <div class="pills" aria-label="Fixture rounds">
      <button v-for="number in rounds" :key="number" type="button" class="button" :aria-pressed="number === round" @click="selected = number">
        {{ roundLabel(tournament, number) }}
      </button>
    </div>
    <section class="panel">
      <div class="panel-heading"><h2>{{ roundLabel(tournament, round) }}</h2><span class="muted">{{ matches.length }} {{ matches.length === 1 ? "fixture" : "fixtures" }}</span></div>
      <MatchRow v-for="match in matches" :key="match.id" :match="match" :tournament="tournament" @open="(kind, id) => emit('open', kind, id)" />
    </section>
  </template>
  <section v-else class="panel empty">
    <h3>Schedule pending</h3>
    <p class="muted">Register at least two teams. Generating fixtures closes registration.</p>
    <RouterLink :to="{ name: 'teams' }" class="button mt-3">View teams</RouterLink>
  </section>
</template>
