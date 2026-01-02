import { UserResponse, StatsResponse } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';

export class UserAPI {

  static async getUsers(
    letter: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<UserResponse> {
    const url = `${API_BASE_URL}/users?letter=${letter}&offset=${offset}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Erreur HTTP: ${response.status}`);
    }
    
    return response.json();
  }


  static async getStats(): Promise<StatsResponse> {
    const url = `${API_BASE_URL}/stats`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return response.json();
  }
}