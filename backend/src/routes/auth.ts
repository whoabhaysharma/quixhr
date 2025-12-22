import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/firebase-login', authController.firebaseLogin);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);

export default router;
