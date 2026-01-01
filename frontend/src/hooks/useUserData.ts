import { useState, useCallback, useEffect } from 'react';
import { UserAPI } from '../services/api';
import { UserCache, LetterStat } from '../types';

/**
 * Hook personnalisé pour gérer les données des utilisateurs
 * Gère le chargement, la pagination, le cache et la navigation par lettre
 */
export const useUserData = () => {
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [users, setUsers] = useState<string[]>([]);
  const [cache, setCache] = useState<UserCache>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalForLetter, setTotalForLetter] = useState<number>(0);
  const [letterStats, setLetterStats] = useState<LetterStat[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Clé de cache basée sur lettre et offset
  const getCacheKey = (letter: string, offset: number) => `${letter}-${offset}`;

  /**
   * Charge les statistiques au montage du composant
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await UserAPI.getStats();
        setLetterStats(stats.letterStats);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
        setError('Impossible de charger les statistiques');
      }
    };
    loadStats();
  }, []);

  /**
   * Charge un batch d'utilisateurs pour la lettre courante
   */
  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    const offset = users.length;
    const cacheKey = getCacheKey(currentLetter, offset);

    try {
      // Vérifier le cache d'abord
      if (cache[cacheKey]) {
        setUsers(prev => [...prev, ...cache[cacheKey]]);
        setLoading(false);
        return;
      }

      // Appel API si pas en cache
      const response = await UserAPI.getUsers(currentLetter, offset, 50);

      // Mise à jour du cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: response.users
      }));

      // Mise à jour de l'état
      setUsers(prev => [...prev, ...response.users]);
      setHasMore(response.hasMore);
      setTotalForLetter(response.total);

    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [currentLetter, users.length, hasMore, loading, cache]);

  /**
   * Change la lettre active et réinitialise la liste
   */
  const changeLetter = useCallback(async (letter: string) => {
    setCurrentLetter(letter);
    setUsers([]);
    setHasMore(true);
    setTotalForLetter(0);
    setLoading(true);
    setError(null);

    const cacheKey = getCacheKey(letter, 0);

    try {
      // Vérifier le cache
      if (cache[cacheKey]) {
        setUsers(cache[cacheKey]);
        setLoading(false);
        return;
      }

      // Charger depuis l'API
      const response = await UserAPI.getUsers(letter, 0, 50);

      setCache(prev => ({
        ...prev,
        [cacheKey]: response.users
      }));

      setUsers(response.users);
      setHasMore(response.hasMore);
      setTotalForLetter(response.total);

    } catch (error) {
      console.error('Erreur changement lettre:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [cache]);

  return {
    currentLetter,
    users,
    loading,
    hasMore,
    totalForLetter,
    letterStats,
    error,
    loadMoreUsers,
    changeLetter
  };
};