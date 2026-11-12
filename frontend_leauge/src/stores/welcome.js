import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useWelcomeToastStore = defineStore("welcomeToast", () => {
  const notice = shallowRef(null);

  function show(greeting, detail, name) {
    const displayName = typeof name === "string" ? name.trim() : "";
    const nameSuffix = displayName ? ", " + displayName : "";

    notice.value = {
      title: greeting + nameSuffix + "!",
      detail,
    };
  }

  function showAccountCreated(name) {
    show("Welcome to ATLM", "Your account was created successfully.", name);
  }

  function showSignedIn(name) {
    show("Welcome back", "You're signed in.", name);
  }

  function dismiss() {
    notice.value = null;
  }

  return { notice, showAccountCreated, showSignedIn, dismiss };
});

