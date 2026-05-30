'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'deploid_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse favorites from localStorage', e);
    }
    setIsMounted(true);
  }, []);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY && e.newValue) {
        try {
          setFavorites(JSON.parse(e.newValue));
        } catch (e) {
          console.warn('Failed to parse favorites from storage event', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save favorites to localStorage', e);
      }
      
      return next;
    });
  }, []);

  return { favorites, toggleFavorite, isMounted };
}
