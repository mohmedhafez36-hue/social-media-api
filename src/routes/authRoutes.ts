import Router from 'express';
import {
    register,
    login,
    auth_refresh,
    change_password
} from '../controllers/authController.js';

import { validate } from '../middlewares/validate.js';
import { createUserSchema,
        loginSchema,
        changePasswordSchema
     } from '../validators/authValidator.js';

import { loginRateLimiter } from '../middlewares/rateLimiter.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.post("/register", validate(createUserSchema), register);
router.post("/login" , loginRateLimiter , validate(loginSchema) , login);
router.post("/refresh" , auth_refresh);
router.patch("/change_password" , authenticate , validate(changePasswordSchema) ,  change_password);

export default router;