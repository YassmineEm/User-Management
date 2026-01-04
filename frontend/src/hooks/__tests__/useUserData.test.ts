import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserData } from '../useUserData';
import { UserAPI } from '../../services/api';


vi.mock('../../services/api', () => ({
  UserAPI: {
    getUsers: vi.fn(),
    getStats: vi.fn(),
  },
}));

describe('useUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait initialiser avec la lettre A', async () => {
    vi.mocked(UserAPI.getStats).mockResolvedValue({
      totalUsers: 0,
      letterStats: [],
    });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.currentLetter).toBe('A');
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
  });


  it('devrait charger les statistiques au montage', async () => {
    const mockStats = {
      totalUsers: 100,
      letterStats: [
        { letter: 'A', count: 50 },
        { letter: 'B', count: 50 },
      ],
    };

    vi.mocked(UserAPI.getStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.letterStats).toHaveLength(2);
    });

    expect(result.current.letterStats[0].letter).toBe('A');
  });

  it('devrait charger des utilisateurs', async () => {
    const mockResponse = {
      letter: 'A',
      offset: 0,
      limit: 50,
      users: ['Alice', 'Anna'],
      total: 2,
      hasMore: false,
      returned: 2,
    };

    vi.mocked(UserAPI.getUsers).mockResolvedValue(mockResponse);
    vi.mocked(UserAPI.getStats).mockResolvedValue({
      totalUsers: 2,
      letterStats: [{ letter: 'A', count: 2 }],
    });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.letterStats).toHaveLength(1);
    });


    await act(async () => {
      await result.current.changeLetter('A');
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
    });

    expect(result.current.users[0]).toBe('Alice');
  });
});