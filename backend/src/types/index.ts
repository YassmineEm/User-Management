export interface LetterIndex {
  letter: string;
  startLine: number;
  count: number;
}


export interface UsersResult {
  users: string[];
  total: number;
  hasMore: boolean;
}


export interface LetterStat {
  letter: string;
  count: number;
}


export interface UsersAPIResponse {
  letter: string;
  offset: number;
  limit: number;
  users: string[];
  total: number;
  hasMore: boolean;
  returned: number;
}


export interface StatsAPIResponse {
  totalUsers: number;
  letterStats: LetterStat[];
}


export interface FileServiceConfig {
  filePath: string;
  encoding?: BufferEncoding;
}


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