<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { localDate, roundLabel, statusLabel } from "../format.js";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({
  kind: { type: String, required: true },
  id: String,
  tournament: { type: Object, required: true },
});
const emit = defineEmits(["close", "navigate"]);
const store = useWorkspaceStore();
const dialog = ref(null);
const busy = ref(false);
const error = ref("");
const match = computed(() => props.tournament.matches.find(({ id }) => id === props.id));
const team = computed(() => store.teamsById.get(props.id));
const canManage = computed(() => store.isManager && team.value?.managed);
const canEdit = computed(() => {
  if (props.kind === "team") return store.isManager;
  if (props.kind === "roster" || props.kind === "register") return canManage.value;
  return store.isOrganizer;
});
const fields = reactive({
  name: "",
  startDate: localDate(),
  format: "league",
  number: "",
  dateTime: match.value?.dateTime ?? "",
  venue: match.value?.venue ?? "",
  home: match.value?.result?.home ?? "",
  away: match.value?.result?.away ?? "",
  tiebreakWinnerId: match.value?.result?.tiebreakWinnerId ?? "",
});
const tiedKnockout = computed(() => props.tournament.format === "knockout" && Number.isInteger(fields.home) && fields.home === fields.away);
const title = computed(() => ({
  tournament: "New competition",
  team: "Create team",
  roster: team.value?.name ?? "Team roster",
  register: "Register team",
  generate: "Generate fixtures",
  schedule: match.value?.dateTime ? "Edit fixture schedule" : "Set fixture schedule",
  score: match.value?.result ? "Edit match score" : "Record match score",
})[props.kind]);
const submitLabel = computed(() => ({
  tournament: "Create competition",
  team: "Create team",
  roster: "Add player",
  register: "Register team",
  generate: "Generate fixtures",
  schedule: "Save schedule",
  score: "Save score",
})[props.kind]);

function close() {
  if (!busy.value) emit("close");
}

async function change(method, args, stayOpen = false) {
  if (busy.value || !canEdit.value) return;
  busy.value = true;
  error.value = "";
  try {
    const result = await store.change(method, ...args);
    if (method === "createTournament") emit("navigate", "teams", result);
    else if (method === "generateFixtures") emit("navigate", "fixtures", props.tournament.id);
    else if (!stayOpen) emit("close");
    if (method === "addPlayer") {
      fields.name = "";
      fields.number = "";
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "The change could not be saved.";
  } finally {
    busy.value = false;
  }
}

function submit() {
  const tournamentId = props.tournament.id;
  switch (props.kind) {
    case "tournament":
      return change("createTournament", [{ name: fields.name, format: fields.format, startDate: fields.startDate }]);
    case "team":
      return change("createTeam", [fields.name]);
    case "roster":
      return change("addPlayer", [props.id, { name: fields.name, number: fields.number }], true);
    case "register":
      return change("registerTeam", [tournamentId, props.id]);
    case "generate":
      return change("generateFixtures", [tournamentId]);
    case "schedule":
      return change("scheduleMatch", [tournamentId, props.id, { dateTime: fields.dateTime, venue: fields.venue }]);
    case "score":
      return change("saveResult", [tournamentId, props.id, {
        home: fields.home,
        away: fields.away,
        tiebreakWinnerId: tiedKnockout.value ? fields.tiebreakWinnerId : null,
      }]);
  }
}

onMounted(() => dialog.value.showModal());
onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close();
});
</script>

<template>
  <dialog ref="dialog" aria-labelledby="action-title" @cancel.prevent="close">
    <header class="dialog-head">
      <div>
        <h2 id="action-title">{{ title }}</h2>
        <p v-if="match" class="muted">{{ roundLabel(tournament, match.round) }} · {{ statusLabel(match.status) }}</p>
        <p v-else-if="kind === 'roster'" class="muted">{{ team?.players.length ?? 0 }} in the roster</p>
      </div>
      <button type="button" class="button small" :disabled="busy" @click="close">Close</button>
    </header>
    <div class="dialog-body">
      <div v-if="kind === 'roster'" class="roster-list">
        <div v-for="player in team?.players" :key="player.id" class="roster-entry">
          <span><span class="badge">{{ player.number }}</span>{{ player.name }}</span>
          <button
            v-if="canManage"
            type="button"
            class="button small danger"
            :aria-label="'Remove ' + player.name"
            :disabled="busy"
            @click="change('removePlayer', [id, player.id], true)"
          >Remove</button>
        </div>
        <p v-if="!team?.players.length" class="muted">No players added yet.</p>
      </div>
      <form v-if="canEdit" @submit.prevent="submit">
        <template v-if="kind === 'tournament'">
          <label>Competition name<input v-model="fields.name" maxlength="56" required autofocus /></label>
          <label>Start date<input v-model="fields.startDate" type="date" required /></label>
          <fieldset class="format-options">
            <legend>Format</legend>
            <label><input v-model="fields.format" type="radio" value="league" /><span>Round-robin league<small>Each team plays every opponent once.</small></span></label>
            <label><input v-model="fields.format" type="radio" value="knockout" /><span>Single-elimination cup<small>Winners advance through the bracket.</small></span></label>
          </fieldset>
        </template>
        <label v-else-if="kind === 'team'">Team name<input v-model="fields.name" maxlength="36" required autofocus /></label>
        <div v-else-if="kind === 'roster'" class="form-pair">
          <label>Player name<input v-model="fields.name" maxlength="40" required autofocus /></label>
          <label>Jersey number<input v-model.number="fields.number" type="number" min="1" max="99" step="1" required /></label>
        </div>
        <p v-else-if="kind === 'register'" class="muted">Enter {{ team?.name }} in {{ tournament.name }}.</p>
        <p v-else-if="kind === 'generate'" class="muted">
          Generate fixtures for {{ tournament.registeredTeamIds.length }} registered teams. This closes registration.
        </p>
        <template v-else-if="kind === 'schedule'">
          <label>Local date and time<input v-model="fields.dateTime" type="datetime-local" :min="tournament.startDate + 'T00:00'" required autofocus /></label>
          <label>Venue<input v-model="fields.venue" maxlength="48" required /></label>
        </template>
        <template v-else-if="kind === 'score'">
          <div class="score-inputs">
            <label>{{ store.teamName(match.homeId) }}<input v-model.number="fields.home" type="number" min="0" max="99" step="1" required autofocus /></label>
            <label>{{ store.teamName(match.awayId) }}<input v-model.number="fields.away" type="number" min="0" max="99" step="1" required /></label>
          </div>
          <label v-if="tiedKnockout">Tiebreak winner
            <select v-model="fields.tiebreakWinnerId" required>
              <option disabled value="">Choose the winner</option>
              <option :value="match.homeId">{{ store.teamName(match.homeId) }}</option>
              <option :value="match.awayId">{{ store.teamName(match.awayId) }}</option>
            </select>
          </label>
        </template>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <div class="dialog-footer">
          <template v-if="kind === 'score'">
            <button v-if="match.status === 'scheduled'" type="button" class="button" :disabled="busy" @click="change('startMatch', [tournament.id, match.id])">Start match</button>
            <button v-else type="button" class="button danger" :disabled="busy" @click="change('clearResult', [tournament.id, match.id])">{{ match.result ? "Clear score" : "Reset start" }}</button>
          </template>
          <button type="button" class="button" :disabled="busy" @click="close">{{ kind === "roster" ? "Done" : "Cancel" }}</button>
          <button type="submit" class="button primary" :disabled="busy">{{ busy ? "Saving…" : submitLabel }}</button>
        </div>
      </form>
      <button v-else type="button" class="button" @click="close">Done</button>
    </div>
  </dialog>
</template>
