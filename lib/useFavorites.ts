'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'deploid_favorites';

function parseFavorites(value: string | null) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.filter((item): item is string => typeof item === 'string')))
      : [];
  } catch (error) {
    console.warn('Failed to parse favorites from localStorage', error);
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // localStorage（外部システム）から初期値を読み込む。以後の変化は下の
    // storageイベント購読エフェクトが担う（React公式の「外部システムに同期する」パターン）。
    const loadInitialFavorites = () => {
      setFavorites(parseFavorites(localStorage.getItem(FAVORITES_KEY)));
      setIsMounted(true);
    };
    loadInitialFavorites();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        setFavorites(parseFavorites(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id];

      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn('Failed to save favorites to localStorage', error);
      }

      return next;
    });
  }, []);

  return { favorites, toggleFavorite, isMounted };
}
