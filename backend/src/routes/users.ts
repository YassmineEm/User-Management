import express, { Request, Response, Router } from 'express';
import { UserFileService } from '../services/UserFileService';
import { UsersAPIResponse, StatsAPIResponse, ServiceError } from '../types';

const router: Router = express.Router();


let userService: UserFileService;

/**
 * @param service - Instance de UserFileService
 * @returns Router Express
 */
export function initializeUserRoutes(service: UserFileService): Router {
  userService = service;
  return router;
}


router.get('/users', async (req: Request, res: Response) => {
  try {

    const letter = (req.query.letter as string)?.toUpperCase();
    const offset = parseInt(req.query.offset as string) || 0;
    const rawLimit = parseInt(req.query.limit as string) || 50;
    
    
    const limit = Math.min(rawLimit, 100);

    
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


    if (offset < 0) {
      return res.status(400).json({
        error: 'L\'offset doit être >= 0',
        code: 'INVALID_OFFSET'
      });
    }


    if (limit < 1) {
      return res.status(400).json({
        error: 'La limite doit être >= 1',
        code: 'INVALID_LIMIT'
      });
    }

    const startTime = Date.now();

    const result = await userService.getUsersByLetter(letter, offset, limit);

    const duration = Date.now() - startTime;

    const response: UsersAPIResponse = {
      letter,
      offset,
      limit,
      users: result.users,
      total: result.total,
      hasMore: result.hasMore,
      returned: result.users.length
    };


    console.log(
      `[${new Date().toISOString()}] GET /users - ` +
      `Letter: ${letter}, Offset: ${offset}, Returned: ${result.users.length}, ` +
      `Duration: ${duration}ms`
    );

    res.json(response);

  } catch (error) {
    handleError(error, res);
  }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = userService.getStats();
    
    const response: StatsAPIResponse = {
      totalUsers: userService.getTotalUsers(),
      letterStats: stats
    };

    console.log(`[${new Date().toISOString()}] GET /stats - Total: ${response.totalUsers.toLocaleString()}`);

    res.json(response);

  } catch (error) {
    handleError(error, res);
  }
});


router.get('/letter/:letter', (req: Request, res: Response) => {
  try {
    const letter = req.params.letter.toUpperCase();

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
 * @param error - Erreur capturée
 * @param res - Objet Response Express
 */
function handleError(error: unknown, res: Response): void {
  console.error('Erreur API:', error);

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