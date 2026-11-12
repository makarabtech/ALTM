import { useAuthStore } from "../stores/auth.js";

const adminHomeName = "admin-home";

export function isAdminSession(auth) {
  const role = auth.user?.role;
  return !auth.demo && typeof role === "string" && role.trim().toLowerCase() === "admin";
}

export function regularHome(auth) {
  return auth.user || auth.demo ? "/" : { name: "login" };
}

export function installAdminHome(router) {
  router.addRoute({
    path: "/admin",
    name: adminHomeName,
    component: () => import("../views/AdminHomeView.vue"),
    meta: { requiresAuth: true },
  });

  router.beforeEach((to) => {
    const auth = useAuthStore();
    const admin = isAdminSession(auth);

    if (to.name === adminHomeName) {
      return admin ? true : regularHome(auth);
    }

    // The existing "/" route may redirect to the default competition.
    const opensHome = to.path === "/" || to.redirectedFrom?.path === "/";
    if (admin && opensHome) {
      return { name: adminHomeName, replace: true };
    }
  });
}

