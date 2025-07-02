import { useState, useEffect } from 'react';
const isBrowser = typeof window !== 'undefined';
const getInitialFavorites = () => { if (!isBrowser) return []; const savedFavorites = localStorage.getItem('favoriteSummaries'); return savedFavorites ? JSON.parse(savedFavorites) : []; };
export const useFavorites = () => {
  const [favorites, setFavorites] = useState(getInitialFavorites);
  useEffect(() => { if (isBrowser) { localStorage.setItem('favoriteSummaries', JSON.stringify(favorites)); } }, [favorites]);
  const toggleFavorite = (slug) => { setFavorites((prev) => prev.includes(slug) ? prev.filter((f) => f !== slug) : [...prev, slug]); };
  return { favorites, toggleFavorite };
};