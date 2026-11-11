<script setup>
defineProps({ name: { type: String, required: true } });

const paths = {
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  teams: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  fixtures: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm11-2v4M8 3v4M3 11h18m-12 5h2m3 0h2",
  standings: "M5 20h14M7 16v-4m5 4V8m5 8V4",
  bracket: "M3 4h6v16H3m6-8h6m0-4v8m0-8h6m-6 8h6",
  complete: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-13 0 2.5 2.5L16 9",
};
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name]" />
  </svg>
</template>
