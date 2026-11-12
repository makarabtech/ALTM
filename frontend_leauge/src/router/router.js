import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useWorkspaceStore } from "../stores/workspace.js";
import { isAdminSession } from "./adminHome.js";

const landingPage = {
  organizer: "overview",
  manager: "teams",
  viewer: "outcome",
};

function workspaceHome(tournamentId = "campus-league") {
  const { role } = useWorkspaceStore();
  return {
    name: landingPage[role] ?? "overview",
    params: { tournamentId },
  };
}

function accountHome(auth = useAuthStore()) {
  if (!auth.canEnter) return { name: "login" };
  return isAdminSession(auth) ? { name: "admin-home" } : workspaceHome();
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: () => accountHome() },
    {
      path: "/login",
      name: "login",
      meta: { guestOnly: true },
      component: () => import("../views/LoginViews.vue"),
    },
    {
      path: "/register",
      name: "register",
      meta: { guestOnly: true },
      component: () => import("../views/RegisterViews.vue"),
    },
    {
      path: "/admin",
      name: "admin-home",
      meta: { adminOnly: true },
      component: () => import("../views/AdminHomeView.vue"),
    },
    {
      path: "/tournaments/:tournamentId",
      name: "competition",
      redirect: (to) => workspaceHome(to.params.tournamentId),
      meta: { workspace: true },
      children: [
        { path: "overview", name: "overview", component: () => import("../views/OverviewView.vue") },
        { path: "teams", name: "teams", component: () => import("../views/TeamsView.vue") },
        { path: "fixtures", name: "fixtures", component: () => import("../views/FixturesView.vue") },
        { path: "outcome", name: "outcome", component: () => import("../views/OutcomeView.vue") },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: () => accountHome() },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if ((to.meta.workspace || to.meta.adminOnly) && !auth.canEnter) {
    return { name: "login" };
  }

  if (to.meta.adminOnly && !isAdminSession(auth)) {
    return workspaceHome();
  }

  if (to.meta.guestOnly && auth.canEnter) {
    return accountHome(auth);
  }
});

export default router;