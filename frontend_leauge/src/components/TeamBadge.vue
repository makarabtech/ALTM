<script setup>
import { computed } from "vue";
import { useWorkspaceStore } from "../stores/workspace.js";

const props = defineProps({ id: { type: String, required: true } });
const store = useWorkspaceStore();
const name = computed(() => store.teamName(props.id, "Unknown team"));
const initials = computed(() => name.value.split(" ").slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase());
const color = computed(() => props.id.codePointAt(0) % 5);
</script>

<template>
  <span class="club"><span class="badge" :class="'t' + color" aria-hidden="true">{{ initials }}</span><span class="club-name">{{ name }}</span></span>
</template>
