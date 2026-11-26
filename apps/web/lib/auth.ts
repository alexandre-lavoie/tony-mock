import type { LoginResponse } from "@influencial/contracts";

export type SessionUser = LoginResponse["user"];

const storageKey = "influencial.user";
const authChangeEvent = "influencial:auth-change";

export function getStoredUser(): SessionUser | null {
  const value = window.localStorage.getItem(storageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function storeUser(user: SessionUser): void {
  window.localStorage.setItem(storageKey, JSON.stringify(user));
  window.dispatchEvent(new Event(authChangeEvent));
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new Event(authChangeEvent));
}

export function subscribeToAuthChange(listener: () => void): () => void {
  window.addEventListener(authChangeEvent, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(authChangeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}
