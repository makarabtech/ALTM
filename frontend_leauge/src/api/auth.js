
import {
  authenticateDemoAccount,
  registerDemoAccount
} from "../demo/accounts.js";

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const loginPath =
  (import.meta.env.VITE_LOGIN_PATH ?? "").trim() || "/login";

const registerPath =
  (import.meta.env.VITE_REGISTER_PATH ?? "").trim() || "/register";

const profilePath =
  (import.meta.env.VITE_PROFILE_PATH ?? "").trim() || "/profile";

export const authApiConfigured = Boolean(apiBase);


// Normalize user roles
function normalizeRole(role) {
  const key =
    typeof role === "string"
      ? role.trim().toLowerCase().replace(/[\s_-]/g, "")
      : "";

  if (key === "admin" || key === "administrator") return "admin";
  if (key === "organizer") return "organizer";
  if (key === "manager" || key === "teammanager") return "manager";
  if (key === "viewer" || key === "user") return "viewer";

  return "viewer";
}


// Common API request function
async function requestJson(
  path,
  {
    method = "GET",
    body,
    token,
    allowNoContent = false
  } = {}
) {
  const headers = {
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache"
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${apiBase}/${path.replace(/^\/+/, "")}`,
      {
        method,
        headers,
        credentials: "omit",
        cache: "no-store",
        body: body ? JSON.stringify(body) : undefined
      }
    );
  } catch {
    throw new Error(
      "Could not reach the account API. Check the backend address and try again."
    );
  }

  if (allowNoContent && response.status === 204) {
    return null;
  }

  if (response.status === 304) {
    throw new Error(
      "The server returned a cached response. Please refresh and try again."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `The request failed (${response.status}).`;

    throw new Error(message);
  }

  if (data === null || typeof data !== "object") {
    throw new Error("Expected a JSON response from the account API.");
  }

  return data;
}


// Register account
export async function registerAccount({
  name,
  email,
  password,
  role
}) {
  const selectedRole = normalizeRole(role);

  if (!authApiConfigured) {
    await registerDemoAccount({
      name,
      email,
      password,
      role: selectedRole
    });

    return;
  }

  if (selectedRole === "organizer") {
    throw new Error(
      "Organizer accounts must be created by an administrator."
    );
  }

  await requestJson(registerPath, {
    method: "POST",
    body: {
      name,
      email,
      password,
      role: selectedRole.toUpperCase()
    },
    allowNoContent: true
  });
}


// Authenticate user
export async function authenticate({ email, password }) {

  // Demo authentication
  if (!authApiConfigured) {
    const user = await authenticateDemoAccount({
      email,
      password
    });

    return {
      token: null,
      user: {
        ...user,
        role: normalizeRole(user.role)
      }
    };
  }

  // Step 1: Login
  const login = await requestJson(loginPath, {
    method: "POST",
    body: {
      email,
      password
    }
  });

  const token =
    login.token ??
    login.accessToken ??
    login.data?.token ??
    login.data?.accessToken;

  if (typeof token !== "string" || !token.trim()) {
    throw new Error(
      "The login response needs a token or accessToken field."
    );
  }

  // Step 2: Get user profile
  const profile = await requestJson(profilePath, {
    token
  });

  const account =
    profile.user ??
    profile.data?.user ??
    profile.data ??
    profile;

  const id =
    account?.id ??
    account?.userId ??
    account?.sub ??
    account?.email;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    !String(id).trim()
  ) {
    throw new Error(
      "The profile response needs a user ID or email."
    );
  }

  // Step 3: Return authenticated user
  return {
    token,

    user: {
      id: String(id),

      name:
        typeof account.name === "string"
          ? account.name.trim()
          : "",

      email:
        typeof account.email === "string"
          ? account.email
          : "",

      role: normalizeRole(account.role)
    }
  };
}
