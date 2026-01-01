import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { UserFileService } from './services/UserFileService';
import { initializeUserRoutes } from './routes/users';

// Charger les variables d'environnement
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_FILE = process.env.DATA_FILE || 'usernames.txt';

// Initialisation de l'application Express
const app: Application = express();

/**
 * Configuration des middlewares
 */

// CORS - Autoriser les requêtes cross-origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON
app.use(express.json());

// Parser URL-encoded
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware de logging des requêtes
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log quand la réponse est terminée
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] ${req.method} ${req.path} - ` +
      `Status: ${res.statusCode} - ` +
      `Duration: ${duration}ms`
    );
  });
  
  next();
});

/**
 * Fonction principale de démarrage du serveur
 */
async function startServer(): Promise<void> {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   🚀 Démarrage du serveur backend             ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log(`📍 Environnement: ${NODE_ENV}`);
    console.log(`🔌 Port: ${PORT}`);

    // Déterminer le chemin du fichier de données
    const dataFilePath = path.isAbsolute(DATA_FILE)
      ? DATA_FILE
      : path.join(__dirname, '..', 'data', DATA_FILE);

    console.log(`📂 Fichier de données: ${dataFilePath}\n`);

    // Initialisation du service avec indexation
    console.log('═══════════════════════════════════════════════');
    const userService = new UserFileService(dataFilePath);
    
    // Construction de l'index (peut prendre du temps pour 10M lignes)
    await userService.buildIndex();
    console.log('═══════════════════════════════════════════════\n');

    // Initialisation des routes
    const userRoutes = initializeUserRoutes(userService);
    app.use('/api', userRoutes);

    /**
     * Route de health check
     * GET /health
     * 
     * Vérifie que le serveur fonctionne et que l'index est prêt
     */
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        service: 'user-list-backend',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        index: {
          ready: userService.isReady(),
          totalUsers: userService.getTotalUsers(),
          availableLetters: userService.getAvailableLetters()
        }
      });
    });

    /**
     * Route racine
     * GET /
     */
    app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Backend API - Liste massive d\'utilisateurs',
        version: '1.0.0',
        endpoints: {
          health: 'GET /health',
          stats: 'GET /api/stats',
          users: 'GET /api/users?letter=A&offset=0&limit=50',
          letter: 'GET /api/letter/:letter',
          letters: 'GET /api/letters'
        },
        documentation: 'https://github.com/your-repo/README.md'
      });
    });

    /**
     * Gestion des routes non trouvées (404)
     */
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route non trouvée',
        code: 'NOT_FOUND',
        path: req.path,
        method: req.method
      });
    });

    /**
     * Gestionnaire d'erreurs global
     */
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Erreur non gérée:', err);

      res.status(500).json({
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
        message: NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Démarrage du serveur
    const server = app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log(`║   ✅ Serveur démarré avec succès!             ║`);
      console.log('╚════════════════════════════════════════════════╝\n');
      
      console.log(`🌐 Serveur disponible sur: http://localhost:${PORT}`);
      console.log(`👥 Total utilisateurs: ${userService.getTotalUsers().toLocaleString()}`);
      console.log(`🔤 Lettres disponibles: ${userService.getAvailableLetters().join(', ')}`);
      
      console.log('\n📍 Endpoints disponibles:');
      console.log(`   ├─ GET  /health`);
      console.log(`   ├─ GET  /api/stats`);
      console.log(`   ├─ GET  /api/users?letter=A&offset=0&limit=50`);
      console.log(`   ├─ GET  /api/letter/:letter`);
      console.log(`   └─ GET  /api/letters`);
      
      console.log('\n💡 Testez l\'API:');
      console.log(`   curl http://localhost:${PORT}/health`);
      console.log(`   curl http://localhost:${PORT}/api/stats`);
      console.log(`   curl "http://localhost:${PORT}/api/users?letter=A&offset=0&limit=10"`);
      console.log('');
    });

    /**
     * Gestion gracieuse de l'arrêt du serveur
     */
    const gracefulShutdown = (signal: string) => {
      console.log(`\n\n⚠️  Signal ${signal} reçu. Arrêt gracieux du serveur...`);
      
      server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        console.error('❌ Arrêt forcé du serveur (timeout).');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n❌ Erreur fatale lors du démarrage du serveur:');
    console.error(error);
    console.error('\n💡 Vérifiez que:');
    console.error('   1. Le fichier usernames.txt existe dans le dossier data/');
    console.error('   2. Les permissions de lecture sont correctes');
    console.error('   3. Le port 3001 est disponible');
    console.error('');
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();