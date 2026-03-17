import { Router } from 'express';
import { getProfile, updateProfile, listUsers } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All user routes require auth

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/', listUsers);

export default router;
