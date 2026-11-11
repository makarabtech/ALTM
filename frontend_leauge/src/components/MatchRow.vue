<script setup>
import { computed } from "vue";
import { roundLabel, scheduleLabel, statusLabel } from "../format.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({
  match: { type: Object, required: true },
  tournament: { type: Object, required: true },
  compact: Boolean,
});
const emit = defineEmits(["open"]);
const store = useWorkspaceStore();
const playable = computed(() => !props.match.bye && props.match.homeId && props.match.awayId);
const canSchedule = computed(() => store.isOrganizer && !props.compact && !props.match.bye && !props.match.result);
const canScore = computed(() => store.isOrganizer && playable.value);
</script>

<template>
  <article class="match-row">
    <div class="match-main">
      <div class="match-meta">
        <span :class="['status', match.status.replace(' ', '-')]">{{ statusLabel(match.status) }}</span>
        <span v-if="compact">{{ roundLabel(tournament, match.round) }}</span>
        <span v-if="!match.bye">{{ scheduleLabel(match.dateTime) }}</span>
        <span v-if="match.venue">{{ match.venue }}</span>
      </div>
      <p class="match-name">
        {{ store.teamName(match.homeId, match.bye ? "Bye" : "To be decided") }}
        <span v-if="match.result" class="match-score">{{ match.result.home }}–{{ match.result.away }}</span>
        <span v-else class="vs">vs</span>
        {{ store.teamName(match.awayId, match.bye ? "Bye" : "To be decided") }}
      </p>
      <p v-if="match.result?.tiebreakWinnerId" class="muted">{{ store.teamName(match.winnerId) }} won the tiebreak.</p>
    </div>
    <div v-if="canSchedule || canScore" class="match-actions">
      <button v-if="canSchedule" type="button" class="button small" @click="emit('open', 'schedule', match.id)">
        {{ match.dateTime ? "Edit schedule" : "Set schedule" }}
      </button>
      <button v-if="canScore" type="button" class="button small" @click="emit('open', 'score', match.id)">
        {{ match.result ? "Edit score" : "Enter score" }}
      </button>
    </div>
  </article>
</template>
