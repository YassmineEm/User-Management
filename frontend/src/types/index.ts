/**
 * Types et interfaces pour l'application frontend
 */

export interface UserResponse {
  letter: string;
  offset: number;
  limit: number;
  users: string[];
  total: number;
  hasMore: boolean;
  returned: number;
}

export interface StatsResponse {
  totalUsers: number;
  letterStats: LetterStat[];
}

export interface LetterStat {
  letter: string;
  count: number;
}

export interface UserCache {
  [key: string]: string[]; // key: "A-0", "A-50", etc.
}