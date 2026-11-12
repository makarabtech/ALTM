import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { authenticate } from "../api/auth.js";

const demoKey = "atlm-demo-session";

export const roleLabels = {
  admin: "Administrator",
  organizer: "Organizer",
  manager: "Team Manager",
  viewer: "Viewer",
};

function readDemoSession() {
  try {
    return window.sessionStorage.getItem(demoKey) === "1";
  } catch {
    return false;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const session = shallowRef(null);
  const demo = ref(readDemoSession());
  const user = computed(() => session.value?.user ?? null);
  const canEnter = computed(() => Boolean(user.value || demo.value));

  function setDemo(active) {
    demo.value = active;
    try {
      if (active) window.sessionStorage.setItem(demoKey, "1");
      else window.sessionStorage.removeItem(demoKey);
    } catch {
      // The in-memory demo flag still works for this page.
    }
  }

  async function signIn(credentials) {
    const verifiedSession = await authenticate(credentials);
    setDemo(false);
    session.value = verifiedSession;
  }

  function enterDemo() {
    session.value = null;
    setDemo(true);
  }

  function signOut() {
    session.value = null;
    setDemo(false);
  }

  return { session, demo, user, canEnter, signIn, enterDemo, signOut };
});
