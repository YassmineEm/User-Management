/**
 * Types et interfaces pour l'application backend
 */

/**
 * Index d'une lettre dans le fichier
 * Contient la position de départ et le nombre d'utilisateurs
 */
export interface LetterIndex {
  letter: string;
  startLine: number;
  count: number;
}

/**
 * Résultat de la récupération des utilisateurs
 */
export interface UsersResult {
  users: string[];
  total: number;
  hasMore: boolean;
}

/**
 * Statistiques d'une lettre
 */
export interface LetterStat {
  letter: string;
  count: number;
}

/**
 * Réponse API pour les utilisateurs
 */
export interface UsersAPIResponse {
  letter: string;
  offset: number;
  limit: number;
  users: string[];
  total: number;
  hasMore: boolean;
  returned: number;
}

/**
 * Réponse API pour les statistiques
 */
export interface StatsAPIResponse {
  totalUsers: number;
  letterStats: LetterStat[];
}

/**
 * Configuration du service de fichiers
 */
export interface FileServiceConfig {
  filePath: string;
  encoding?: BufferEncoding;
}

/**
 * Erreur personnalisée pour le service
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}