<script setup>
import AppIcon from "./AppIcon.vue";
import ThemeToggle from "./ThemeToggle.vue";

const roles = [
  { name: "Organizer", icon: "fixtures", detail: "Create tournaments, schedule matches, and record scores." },
  { name: "Team Manager", icon: "teams", detail: "Manage player rosters and register teams." },
  { name: "Viewer", icon: "standings", detail: "Follow fixtures, results, standings, and brackets." },
];
</script>

<template>
  <div class="login-page">
    <header class="login-topbar">
      <div class="login-brand">
        <img src="/mark.svg" width="42" height="42" alt="" />
        <div><strong>ATLM</strong><small>Competition manager</small></div>
      </div>
      <ThemeToggle />
    </header>

    <main class="login-grid">
      <section class="login-showcase" aria-labelledby="workspace-title">
        <svg class="login-pitch" viewBox="0 0 390 245" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="20" y="16" width="350" height="213" rx="5" />
          <path d="M195 16v213M20 65h54v115H20m350-115h-54v115h54M20 94h23v57H20m350-57h-23v57h23M74 98a31 31 0 0 1 0 49m242-49a31 31 0 0 0 0 49" />
          <circle cx="195" cy="122.5" r="32" />
          <circle cx="195" cy="122.5" r="3" fill="currentColor" />
        </svg>

        <div class="login-showcase-content">
          <span class="eyebrow">Football competition workspace</span>
          <h2 id="workspace-title">Automated Tournament and League Manager</h2>
          <ul class="login-role-list">
            <li v-for="role in roles" :key="role.name">
              <span class="login-role-icon"><AppIcon :name="role.icon" /></span>
              <div><strong>{{ role.name }}</strong><p>{{ role.detail }}</p></div>
            </li>
          </ul>
        </div>
      </section>

      <slot />
    </main>
  </div>
</template>
