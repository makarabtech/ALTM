const accountPrefix = "atlm-demo-account-v1:";
const encoder = new TextEncoder();

function accountKey(email) {
  return accountPrefix + email.trim().toLowerCase();
}

function demoCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Open the Vite localhost URL or use HTTPS to access demo accounts.");
  }
  return globalThis.crypto;
}

async function passwordVerifier(password, salt) {
  const { subtle } = demoCrypto();
  const material = await subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 600_000 },
    material,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readAccount(key) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    throw new Error("Could not read demo accounts. Check that this browser allows site storage.");
  }
}

function saveAccount(key, account) {
  if (readAccount(key)) throw new Error("A demo account already uses this email. Try signing in.");
  try {
    window.localStorage.setItem(key, JSON.stringify(account));
  } catch {
    throw new Error("Could not save the demo account. Check that this browser allows site storage.");
  }
}

export async function registerDemoAccount({ name, email, password, role }) {
  const key = accountKey(email);
  const crypto = demoCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    salt: Array.from(salt),
    verifier: await passwordVerifier(password, salt),
  };

  const locks = globalThis.navigator?.locks;
  if (locks) await locks.request(key, () => saveAccount(key, account));
  else saveAccount(key, account);
}

export async function authenticateDemoAccount({ email, password }) {
  const account = readAccount(accountKey(email));
  if (!account || !Array.isArray(account.salt)) {
    throw new Error("Demo email or password is incorrect.");
  }
  const verifier = await passwordVerifier(password, Uint8Array.from(account.salt));
  if (verifier !== account.verifier) throw new Error("Demo email or password is incorrect.");
  return { id: account.id, name: account.name, email: account.email, role: account.role };
}
