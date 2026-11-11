import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { atlmApi } from "../api/atlm.js";
import { useAuthStore } from "./auth.js";

export const useWorkspaceStore = defineStore("workspace", () => {
  const auth = useAuthStore();
  const demoRole = ref("organizer");
  const role = computed(() => auth.user?.role ?? (auth.demo ? demoRole.value : "viewer"));
  const workspace = shallowRef(null);
  const error = ref("");
  const loading = ref(false);
  const teamsById = computed(() => new Map((workspace.value?.teams ?? []).map((team) => [team.id, team])));
  const isOrganizer = computed(() => role.value === "organizer");
  const isManager = computed(() => role.value === "manager");

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      workspace.value = await atlmApi.load();
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : "The workspace could not be loaded.";
    } finally {
      loading.value = false;
    }
  }

  async function change(method, ...args) {
    const result = await atlmApi[method](...args);
    workspace.value = await atlmApi.load();
    return result;
  }

  function teamName(id, fallback = "To be decided") {
    return teamsById.value.get(id)?.name ?? fallback;
  }

  return { role, demoRole, workspace, error, loading, teamsById, isOrganizer, isManager, load, change, teamName };
});
