import { Router } from 'express';
import { registrar, login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.post('/register', registrar);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
export default router;