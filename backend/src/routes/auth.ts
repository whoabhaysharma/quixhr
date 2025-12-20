import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  password: Joi.string().min(6).required(),
  organizationName: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), (req, res) =>
  authController.register(req, res)
);
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.get('/verify-email', (req, res) => authController.verifyEmail(req, res));
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));

export default router;
