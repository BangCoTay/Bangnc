import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/characters', adminController.getCharacters);

router.delete('/users/:id', adminController.deleteUser);
router.delete('/characters/:id', adminController.deleteCharacter);

export default router;
