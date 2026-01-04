import request from 'supertest';
import express, { Application } from 'express';
import { UserFileService } from '../services/UserFileService';
import { initializeUserRoutes } from '../routes/users';
import * as fs from 'fs';
import * as path from 'path';

describe('API Routes', () => {
  let app: Application;
  const testFilePath = path.join(__dirname, 'test-api-data.txt');

  beforeAll(async () => {

    const testData = [
      'Alice Johnson',
      'Anna Smith',
      'Bob Williams'
    ].join('\n');
    
    fs.writeFileSync(testFilePath, testData);


    app = express();
    app.use(express.json());

    const userService = new UserFileService(testFilePath);
    await userService.buildIndex();

    const userRoutes = initializeUserRoutes(userService);
    app.use('/api', userRoutes);
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('GET /api/users', () => {
    it('devrait retourner des utilisateurs pour la lettre A', async () => {
      const response = await request(app)
        .get('/api/users?letter=A&offset=0&limit=10')
        .expect(200);

      expect(response.body.users).toHaveLength(2);
      expect(response.body.letter).toBe('A');
      expect(response.body.total).toBe(2);
    });

    it('devrait retourner 400 pour une lettre manquante', async () => {
      const response = await request(app)
        .get('/api/users?offset=0&limit=10')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('devrait retourner 400 pour une lettre invalide', async () => {
      const response = await request(app)
        .get('/api/users?letter=123&offset=0&limit=10')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('devrait retourner les statistiques', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.totalUsers).toBe(3);
      expect(response.body.letterStats).toHaveLength(2); 
    });
  });

  describe('GET /api/letters', () => {
    it('devrait retourner les lettres disponibles', async () => {
      const response = await request(app)
        .get('/api/letters')
        .expect(200);

      expect(response.body.letters).toContain('A');
      expect(response.body.letters).toContain('B');
      expect(response.body.count).toBe(2);
    });
  });
});