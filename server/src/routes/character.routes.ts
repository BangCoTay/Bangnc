import { Router, Request, Response, NextFunction } from 'express';
import { characterController } from '../controllers/character.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCharacterSchema, updateCharacterSchema, characterListQuerySchema } from '@ai-companions/shared';

const router = Router();

router.get('/', optionalAuthMiddleware, validate(characterListQuerySchema, 'query'), (req: Request, res: Response, next: NextFunction) => characterController.list(req, res, next));
router.get('/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => characterController.getMyCharacters(req, res, next));
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response, next: NextFunction) => characterController.getById(req, res, next));
router.post('/', authMiddleware, validate(createCharacterSchema), (req: Request, res: Response, next: NextFunction) => characterController.create(req, res, next));
router.put('/:id', authMiddleware, validate(updateCharacterSchema), (req: Request, res: Response, next: NextFunction) => characterController.update(req, res, next));
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => characterController.delete(req, res, next));
router.post('/:id/favorite', authMiddleware, (req: Request, res: Response, next: NextFunction) => characterController.toggleFavorite(req, res, next));

export default router;
