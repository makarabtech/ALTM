<script setup>
import TeamBadge from "./TeamBadge.vue";

defineProps({ rows: { type: Array, required: true }, compact: Boolean });
</script>

<template>
  <div v-if="!rows.length" class="empty">
    <h3>No registered teams yet</h3>
    <p class="muted">The table appears when teams register.</p>
  </div>
  <div v-else class="table-scroll">
    <table>
      <caption class="sr-only">League standings</caption>
      <thead>
        <tr>
          <th scope="col">#</th><th scope="col" class="club-cell">Club</th><th scope="col" title="Played">P</th>
          <template v-if="!compact">
            <th scope="col" title="Won">W</th><th scope="col" title="Drawn">D</th><th scope="col" title="Lost">L</th>
          </template>
          <th scope="col" title="Goals for">GF</th><th v-if="!compact" scope="col" title="Goals against">GA</th>
          <th scope="col" title="Goal difference">GD</th><th scope="col" title="Points">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.teamId">
          <td class="rank">{{ row.rank }}</td>
          <td class="club-cell"><TeamBadge :id="row.teamId" /></td>
          <td>{{ row.played }}</td>
          <template v-if="!compact"><td>{{ row.won }}</td><td>{{ row.drawn }}</td><td>{{ row.lost }}</td></template>
          <td>{{ row.goalsFor }}</td><td v-if="!compact">{{ row.goalsAgainst }}</td>
          <td>{{ row.difference > 0 ? "+" : "" }}{{ row.difference }}</td>
          <td class="points">{{ row.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
