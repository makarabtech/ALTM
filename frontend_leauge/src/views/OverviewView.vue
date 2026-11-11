<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import MatchRow from "../components/MatchRow.vue";
import AppIcon from "../components/AppIcon.vue";
import StandingsTable from "../components/StandingsTable.vue";
import { dateLabel, roundLabel } from "../format.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({ tournament: { type: Object, required: true } });
const emit = defineEmits(["open"]);
const store = useWorkspaceStore();
const league = computed(() => props.tournament.format === "league");
const matches = computed(() => props.tournament.matches);
const next = computed(() => matches.value.filter(({ status }) => ["scheduled", "in progress"].includes(status)).slice(0, 3));
const byes = computed(() => matches.value.filter(({ bye }) => bye).length);
const played = computed(() => matches.value.filter(({ result }) => result).length);
const description = computed(() => {
  const { tournament } = props;
  if (!tournament.generated) return "Register teams, then generate the competition fixtures.";
  if (tournament.championId) return `${store.teamName(tournament.championId)} won the cup.`;
  if (tournament.status === "completed" && league.value) {
    const leaders = tournament.standings.filter(({ rank }) => rank === 1).map(({ teamId }) => store.teamName(teamId));
    return leaders.length === 1 ? `${leaders[0]} finished in first place.` : `${leaders.join(", ")} share first place.`;
  }
  return league.value ? "Follow fixtures, results, and the live league table." : "Follow the bracket as winners advance through each round.";
});
const metrics = computed(() => [
  { label: "Registered teams", value: props.tournament.registeredTeamIds.length, icon: "teams" },
  { label: "Matches played", value: `${played.value} / ${matches.value.length - byes.value}`, icon: "complete" },
  { label: "Current round", value: next.value[0] ? roundLabel(props.tournament, next.value[0].round) : props.tournament.status === "completed" ? "Complete" : "—", icon: "fixtures" },
]);
</script>

<template>
  <div class="context"><strong>Competition overview</strong><span>Start date · {{ dateLabel(tournament.startDate) }}</span></div>
  <section class="hero">
    <svg class="hero-pitch" viewBox="0 0 390 245" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
      <rect x="20" y="16" width="350" height="213" rx="5" />
      <path d="M195 16v213M20 65h54v115H20m350-115h-54v115h54M20 94h23v57H20m350-57h-23v57h23M74 98a31 31 0 0 1 0 49m242-49a31 31 0 0 0 0 49" />
      <circle cx="195" cy="122.5" r="32" />
      <circle cx="195" cy="122.5" r="3" fill="currentColor" />
    </svg>
    <div class="hero-content">
      <span class="eyebrow">{{ league ? "Round-robin league" : "Single-elimination cup" }} · {{ tournament.status }}</span>
      <h1>{{ tournament.name }}</h1>
      <p>{{ description }}</p>
      <div class="actions">
        <RouterLink :to="{ name: tournament.generated ? 'fixtures' : 'teams' }" class="button lime">
          <span aria-hidden="true">→</span>{{ tournament.generated ? "View fixtures" : "View teams" }}
        </RouterLink>
        <RouterLink :to="{ name: 'outcome' }" class="button ghost">{{ league ? "View standings" : "View bracket" }}</RouterLink>
      </div>
    </div>
  </section>
  <div class="metrics">
    <div v-for="metric in metrics" :key="metric.label" class="metric">
      <span class="metric-icon" aria-hidden="true"><AppIcon :name="metric.icon" /></span>
      <div><small>{{ metric.label }}</small><strong>{{ metric.value }}</strong></div>
    </div>
  </div>
  <div class="overview-grid">
    <section class="panel">
      <div class="panel-heading"><h2>Next fixtures</h2><RouterLink :to="{ name: 'fixtures' }" class="link-button">All fixtures →</RouterLink></div>
      <MatchRow
        v-for="match in next"
        :key="match.id"
        :match="match"
        :tournament="tournament"
        compact
        @open="(kind, id) => emit('open', kind, id)"
      />
      <div v-if="!next.length" class="empty">
        <h3>{{ tournament.generated ? "No upcoming fixtures" : "Waiting for registrations" }}</h3>
        <p class="muted">{{ tournament.generated ? "Completed results are available in Fixtures." : "Register at least two teams to generate fixtures." }}</p>
      </div>
    </section>
    <section class="panel">
      <div class="panel-heading">
        <h2>{{ league ? "League table" : "Cup bracket" }}</h2>
        <RouterLink :to="{ name: 'outcome' }" class="link-button">{{ league ? "Full table" : "Full bracket" }} →</RouterLink>
      </div>
      <StandingsTable v-if="league" :rows="tournament.standings.slice(0, 6)" compact />
      <div v-else class="empty">
        <h3 v-if="tournament.championId">{{ store.teamName(tournament.championId) }} won the cup</h3>
        <h3 v-else-if="tournament.generated">{{ byes }} first-round {{ byes === 1 ? "bye" : "byes" }}</h3>
        <h3 v-else>Bracket pending</h3>
        <p class="muted">{{ tournament.generated ? "Winners advance when a result is saved." : "Generate fixtures to see the bracket." }}</p>
      </div>
    </section>
  </div>
</template>
