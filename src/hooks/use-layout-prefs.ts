"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "rm-layout-prefs";

/**
 * Persists a numeric layout preference to localStorage.
 * SSR-safe: returns defaultValue on server, reads from localStorage on client after mount.
 */
export function useLayoutPref(key: string, defaultValue: number): [number, (val: number) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}.${key}`);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!isNaN(parsed)) setValue(parsed);
    }
  }, [key]);

  function persist(newVal: number) {
    setValue(newVal);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}.${key}`, String(newVal));
  }

  return [value, persist];
}
