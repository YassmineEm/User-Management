import { UserResponse, StatsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Service API pour communiquer avec le backend
 */
export class UserAPI {
  /**
   * Récupère les utilisateurs pour une lettre donnée avec pagination
   */
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

  /**
   * Récupère les statistiques globales (nombre d'utilisateurs par lettre)
   */
  static async getStats(): Promise<StatsResponse> {
    const url = `${API_BASE_URL}/stats`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return response.json();
  }
}