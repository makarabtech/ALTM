<script setup>
import { computed } from "vue";
import StandingsTable from "../components/StandingsTable.vue";
import { roundLabel, statusLabel } from "../format.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({ tournament: { type: Object, required: true } });
const emit = defineEmits(["open"]);
const store = useWorkspaceStore();
const rounds = computed(() => Array.from({ length: props.tournament.roundCount }, (_, index) => ({
  number: index + 1,
  matches: props.tournament.matches.filter((match) => match.round === index + 1),
})));
const league = computed(() => props.tournament.format === "league");
</script>

<template>
  <div class="section-head">
    <div>
      <span class="eyebrow">{{ tournament.name }}</span>
      <h1>{{ league ? "League standings" : "Knockout bracket" }}</h1>
      <p class="muted">{{ league ? "The table recalculates whenever an organizer saves or clears a score." : "Winners and teams with a bye advance to the next round." }}</p>
    </div>
  </div>
  <section v-if="league" class="panel">
    <StandingsTable :rows="tournament.standings" />
    <p class="table-note muted">Wins earn 3 points and draws earn 1. Teams rank by points, goal difference, then goals scored. Exact ties share a rank.</p>
  </section>
  <section v-else-if="!tournament.generated" class="panel empty">
    <h3>No bracket yet</h3><p class="muted">The bracket appears once the organizer generates fixtures.</p>
  </section>
  <template v-else>
    <p v-if="tournament.championId" class="winner-note"><strong>{{ store.teamName(tournament.championId) }}</strong> won the cup.</p>
    <div class="bracket">
      <section v-for="round in rounds" :key="round.number" class="bracket-round">
        <h2>{{ roundLabel(tournament, round.number) }}</h2>
        <article v-for="match in round.matches" :key="match.id" class="panel bracket-card">
          <div class="match-meta">
            <span :class="['status', match.status.replace(' ', '-')]">{{ statusLabel(match.status) }}</span>
            <span v-if="match.result?.tiebreakWinnerId">Tiebreak</span>
          </div>
          <div v-for="side in ['home', 'away']" :key="side" class="bracket-team">
            <span>{{ store.teamName(match[side + 'Id'], match.bye ? "Bye" : "To be decided") }}</span>
            <strong>{{ match.result?.[side] ?? "" }}<span v-if="match.winnerId && match.winnerId === match[side + 'Id']" aria-label="Winner"> ✓</span></strong>
          </div>
          <div v-if="store.isOrganizer && !match.bye && match.homeId && match.awayId" class="match-actions">
            <button type="button" class="button small" @click="emit('open', 'score', match.id)">{{ match.result ? "Edit score" : "Enter score" }}</button>
          </div>
        </article>
      </section>
    </div>
  </template>
</template>
