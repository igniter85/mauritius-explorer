const AUTH_KEY = "mauritius-auth";

interface AuthState {
  userName: string;
  token: string;
}

export function getAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userName && parsed.token) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setAuth(userName: string, token: string): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userName, token }));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}
