import { useSyncExternalStore } from "react";

function subscribe(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function getHashPath() {
  const path = window.location.hash.replace(/^#/, "");
  return path.startsWith("/") ? path : "/";
}

export function navigateTo(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (getHashPath() !== normalizedPath) {
    window.location.hash = normalizedPath;
  }
}

export function useHashPath() {
  return useSyncExternalStore(subscribe, getHashPath, () => "/");
}

export function matchLocationResults(path) {
  const match = path.match(/^\/locations\/([^/]+)\/results$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
