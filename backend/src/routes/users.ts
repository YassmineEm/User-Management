import express, { Request, Response, Router } from 'express';
import { UserFileService } from '../services/UserFileService';
import { UsersAPIResponse, StatsAPIResponse, ServiceError } from '../types';

const router: Router = express.Router();

// Instance globale du service (sera initialisée au démarrage)
let userService: UserFileService;

/**
 * Initialise les routes avec une instance du service
 * @param service - Instance de UserFileService
 * @returns Router Express
 */
export function initializeUserRoutes(service: UserFileService): Router {
  userService = service;
  return router;
}

/**
 * GET /api/users
 * 
 * Récupère une page d'utilisateurs pour une lettre donnée
 * 
 * Query Parameters:
 *   - letter: string (requis) - Lettre de l'alphabet (A-Z)
 *   - offset: number (optionnel, défaut: 0) - Position de départ
 *   - limit: number (optionnel, défaut: 50, max: 100) - Nombre d'utilisateurs
 * 
 * Exemples:
 *   GET /api/users?letter=A&offset=0&limit=50
 *   GET /api/users?letter=B&offset=100&limit=25
 * 
 * Réponse:
 * {
 *   "letter": "A",
 *   "offset": 0,
 *   "limit": 50,
 *   "users": ["alice", "anna", ...],
 *   "total": 384615,
 *   "hasMore": true,
 *   "returned": 50
 * }
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Extraction des paramètres
    const letter = (req.query.letter as string)?.toUpperCase();
    const offset = parseInt(req.query.offset as string) || 0;
    const rawLimit = parseInt(req.query.limit as string) || 50;
    
    // Limiter le nombre max à 100 pour éviter les requêtes trop lourdes
    const limit = Math.min(rawLimit, 100);

    // Validation de la lettre
    if (!letter) {
      return res.status(400).json({
        error: 'Paramètre "letter" requis',
        code: 'MISSING_LETTER'
      });
    }

    if (letter.length !== 1 || !/[A-Z]/.test(letter)) {
      return res.status(400).json({
        error: 'La lettre doit être comprise entre A et Z',
        code: 'INVALID_LETTER'
      });
    }

    // Validation de l'offset
    if (offset < 0) {
      return res.status(400).json({
        error: 'L\'offset doit être >= 0',
        code: 'INVALID_OFFSET'
      });
    }

    // Validation de la limite
    if (limit < 1) {
      return res.status(400).json({
        error: 'La limite doit être >= 1',
        code: 'INVALID_LIMIT'
      });
    }

    // Mesure de performance
    const startTime = Date.now();

    // Récupération des données
    const result = await userService.getUsersByLetter(letter, offset, limit);

    const duration = Date.now() - startTime;

    // Construction de la réponse
    const response: UsersAPIResponse = {
      letter,
      offset,
      limit,
      users: result.users,
      total: result.total,
      hasMore: result.hasMore,
      returned: result.users.length
    };

    // Log pour le monitoring
    console.log(
      `📊 [${new Date().toISOString()}] GET /users - ` +
      `Letter: ${letter}, Offset: ${offset}, Returned: ${result.users.length}, ` +
      `Duration: ${duration}ms`
    );

    res.json(response);

  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/stats
 * 
 * Retourne les statistiques globales
 * - Nombre total d'utilisateurs
 * - Nombre d'utilisateurs par lettre (A-Z)
 * 
 * Utilisé par le frontend pour générer le menu alphabétique
 * 
 * Réponse:
 * {
 *   "totalUsers": 10000000,
 *   "letterStats": [
 *     { "letter": "A", "count": 384615 },
 *     { "letter": "B", "count": 384615 },
 *     ...
 *   ]
 * }
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = userService.getStats();
    
    const response: StatsAPIResponse = {
      totalUsers: userService.getTotalUsers(),
      letterStats: stats
    };

    console.log(`📊 [${new Date().toISOString()}] GET /stats - Total: ${response.totalUsers.toLocaleString()}`);

    res.json(response);

  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/letter/:letter
 * 
 * Retourne les informations détaillées sur une lettre spécifique
 * 
 * Paramètres:
 *   - letter: string - Lettre (A-Z)
 * 
 * Réponse:
 * {
 *   "letter": "A",
 *   "count": 384615,
 *   "startLine": 0
 * }
 */
router.get('/letter/:letter', (req: Request, res: Response) => {
  try {
    const letter = req.params.letter.toUpperCase();

    // Validation
    if (!/^[A-Z]$/.test(letter)) {
      return res.status(400).json({
        error: 'La lettre doit être comprise entre A et Z',
        code: 'INVALID_LETTER'
      });
    }

    const info = userService.getLetterInfo(letter);

    if (!info) {
      return res.status(404).json({
        error: `Aucun utilisateur trouvé pour la lettre "${letter}"`,
        code: 'LETTER_NOT_FOUND'
      });
    }

    res.json(info);

  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/letters
 * 
 * Retourne la liste des lettres disponibles
 * 
 * Réponse:
 * {
 *   "letters": ["A", "B", "C", ...]
 * }
 */
router.get('/letters', (req: Request, res: Response) => {
  try {
    const letters = userService.getAvailableLetters();

    res.json({
      letters,
      count: letters.length
    });

  } catch (error) {
    handleError(error, res);
  }
});

/**
 * Gestionnaire d'erreurs centralisé
 * @param error - Erreur capturée
 * @param res - Objet Response Express
 */
function handleError(error: unknown, res: Response): void {
  console.error('❌ Erreur API:', error);

  if (error instanceof ServiceError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  } else if (error instanceof Error) {
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } else {
    res.status(500).json({
      error: 'Erreur inconnue',
      code: 'UNKNOWN_ERROR'
    });
  }
}

export default router;