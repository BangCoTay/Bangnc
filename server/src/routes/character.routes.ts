import { Router } from 'express';
import { characterController } from '../controllers/character.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCharacterSchema, updateCharacterSchema, characterListQuerySchema } from '@ai-companions/shared';

const router = Router();

router.get('/', optionalAuthMiddleware, validate(characterListQuerySchema, 'query'), (req, res, next) => characterController.list(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => characterController.getMyCharacters(req, res, next));
router.get('/:id', optionalAuthMiddleware, (req, res, next) => characterController.getById(req, res, next));
router.post('/', authMiddleware, validate(createCharacterSchema), (req, res, next) => characterController.create(req, res, next));
router.put('/:id', authMiddleware, validate(updateCharacterSchema), (req, res, next) => characterController.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => characterController.delete(req, res, next));
router.post('/:id/favorite', authMiddleware, (req, res, next) => characterController.toggleFavorite(req, res, next));

export default router;
