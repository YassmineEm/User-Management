import { useState, useCallback, useEffect } from 'react';
import { UserAPI } from '../services/api';
import { UserCache, LetterStat } from '../types';


export const useUserData = () => {
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [users, setUsers] = useState<string[]>([]);
  const [cache, setCache] = useState<UserCache>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalForLetter, setTotalForLetter] = useState<number>(0);
  const [letterStats, setLetterStats] = useState<LetterStat[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = (letter: string, offset: number) => `${letter}-${offset}`;


  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await UserAPI.getStats();
        if (stats?.letterStats) {
          setLetterStats(stats.letterStats);
        } else {
          setLetterStats([]);
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
        setError('Impossible de charger les statistiques');
      }
    };
    loadStats();
  }, []);


  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    const offset = users.length;
    const cacheKey = getCacheKey(currentLetter, offset);

    try {
      if (cache[cacheKey]) {
        setUsers(prev => [...prev, ...cache[cacheKey]]);
        setLoading(false);
        return;
      }


      const response = await UserAPI.getUsers(currentLetter, offset, 50);


      setCache(prev => ({
        ...prev,
        [cacheKey]: response.users
      }));


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


  const changeLetter = useCallback(async (letter: string) => {
    setCurrentLetter(letter);
    setUsers([]);
    setHasMore(true);
    setTotalForLetter(0);
    setLoading(true);
    setError(null);

    const cacheKey = getCacheKey(letter, 0);

    try {

      if (cache[cacheKey]) {
        setUsers(cache[cacheKey]);
        setLoading(false);
        return;
      }


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