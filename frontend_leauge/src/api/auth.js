import { authenticateDemoAccount, registerDemoAccount } from "../demo/accounts.js";

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const loginPath = (import.meta.env.VITE_LOGIN_PATH ?? "").trim() || "/login";
const registerPath = (import.meta.env.VITE_REGISTER_PATH ?? "").trim() || "/register";
const profilePath = (import.meta.env.VITE_PROFILE_PATH ?? "").trim() || "/profile";

export const authApiConfigured = Boolean(apiBase);

async function requestJson(path, { method = "GET", body, token, allowNoContent = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${apiBase}/${path.replace(/^\/+/, "")}`, {
      method,
      headers,
      credentials: "omit",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the account API. Check the backend address and try again.");
  }

  if (allowNoContent && response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : `The request failed (${response.status}).`;
    throw new Error(message);
  }
  if (data === null || typeof data !== "object") {
    throw new Error("Expected a JSON response from the account API.");
  }
  return data;
}


export async function registerAccount({ name, email, password, role }) {
  if (!authApiConfigured) {
    await registerDemoAccount({ name, email, password, role: normalizeRole(role) });
    return;
  }

  const selectedRole = normalizeRole(role);

  // Organizer accounts should not be created through public registration.
  if (selectedRole === "organizer") {
    throw new Error("Organizer accounts must be created by an administrator.");
  }

  await requestJson(registerPath, {
    method: "POST",
    body: {
      name,
      email,
      password,
      role: selectedRole.toUpperCase(),
    },
    allowNoContent: true,
  });
}



function normalizeRole(role) {
  const key = typeof role === "string"
    ? role.trim().toLowerCase().replace(/[\s_-]/g, "")
    : "";

  if (key === "admin" || key === "administrator") return "admin";
  if (key === "organizer") return "organizer";
  if (key === "manager" || key === "teammanager") return "manager";
  if (key === "viewer" || key === "user") return "viewer";

  return "viewer";
}


export async function authenticate({ email, password }) {
  if (!authApiConfigured) {
    const user = await authenticateDemoAccount({ email, password });
    return { token: null, user: { ...user, role: normalizeRole(user.role) } };
  }

  const login = await requestJson(loginPath, {
    method: "POST",
    body: { email, password },
  });
  const token = login.token ?? login.accessToken ?? login.data?.token ?? login.data?.accessToken;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("The login response needs a token or accessToken field.");
  }

  const profile = await requestJson(profilePath, { token });
  const account = profile.user ?? profile.data?.user ?? profile.data ?? profile;
  const id = account?.id ?? account?.userId ?? account?.sub ?? account?.email;
  if ((typeof id !== "string" && typeof id !== "number") || !String(id).trim()) {
    throw new Error("The profile response needs a user ID or email.");
  }

  return {
    token,
    user: {
      id: String(id),
      name: typeof account.name === "string" ? account.name.trim() : "",
      email: typeof account.email === "string" ? account.email : "",
      role: normalizeRole(account.role),
    },
  };
}
