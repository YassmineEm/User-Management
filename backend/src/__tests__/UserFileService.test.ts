import { UserFileService } from '../services/UserFileService';
import * as fs from 'fs';
import * as path from 'path';

describe('UserFileService', () => {
  let service: UserFileService;
  const testFilePath = path.join(__dirname, 'test-data.txt');

  
  beforeAll(() => {
    const testData = [
      'Alice Johnson',
      'Anna Smith',
      'Bob Williams',
      'Brian Davis',
      'Charlie Brown'
    ].join('\n');
    
    fs.writeFileSync(testFilePath, testData);
  });

  
  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  beforeEach(() => {
    service = new UserFileService(testFilePath);
  });

  describe('buildIndex', () => {
    it('devrait construire l\'index correctement', async () => {
      await service.buildIndex();

      expect(service.getTotalUsers()).toBe(5);
      expect(service.isReady()).toBe(true);
    });

    it('devrait indexer les lettres correctement', async () => {
      await service.buildIndex();

      const infoA = service.getLetterInfo('A');
      expect(infoA).toBeDefined();
      expect(infoA?.count).toBe(2); 

      const infoB = service.getLetterInfo('B');
      expect(infoB).toBeDefined();
      expect(infoB?.count).toBe(2); 

      const infoC = service.getLetterInfo('C');
      expect(infoC).toBeDefined();
      expect(infoC?.count).toBe(1); 
    });
  });

  describe('getUsersByLetter', () => {
    beforeEach(async () => {
      await service.buildIndex();
    });

    it('devrait retourner les utilisateurs pour la lettre A', async () => {
      const result = await service.getUsersByLetter('A', 0, 10);

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toBe('Alice Johnson');
      expect(result.users[1]).toBe('Anna Smith');
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('devrait gérer la pagination correctement', async () => {
      const result = await service.getUsersByLetter('A', 0, 1);

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toBe('Alice Johnson');
      expect(result.hasMore).toBe(true);
    });

    it('devrait retourner un tableau vide pour une lettre sans utilisateurs', async () => {
      const result = await service.getUsersByLetter('Z', 0, 10);

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('devrait lancer une erreur pour une lettre invalide', async () => {
      await expect(
        service.getUsersByLetter('1', 0, 10)
      ).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('devrait retourner les statistiques correctes', async () => {
      await service.buildIndex();
      const stats = service.getStats();

      expect(stats).toHaveLength(3); 
      expect(stats[0].letter).toBe('A');
      expect(stats[0].count).toBe(2);
    });
  });
});