import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { ROLES, ROLE_VALUES } from '../constants';

const router = Router();

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  avatar: Joi.string().optional(),
  role: Joi.string().valid(...ROLE_VALUES).optional(),
}).min(1);

router.use(authenticateToken);

// Public user routes
router.get('/profile/:id', (req, res) => userController.getUserById(req, res));
router.put('/:id', validate(updateUserSchema), (req, res) =>
  userController.updateUser(req, res)
);
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

// Admin only routes
router.get('/', authorize(ROLES.ADMIN), (req, res) => userController.getAllUsers(req, res));
router.get('/role/:role', authorize(ROLES.ADMIN), (req, res) =>
  userController.getUsersByRole(req, res)
);

export default router;
