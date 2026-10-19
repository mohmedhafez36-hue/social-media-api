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

/**
 * @openapi
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *               - birthDate
 *             properties:
 *               userName:
 *                 type: string
 *                 example: mohamed
 *               email:
 *                 type: string
 *                 example: mohamed@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "2004-05-20"
 *     responses:
 *       "201":
 *         description: User created successfully
 *       "400":
 *         description: Invalid input
 */
router.post("/register", validate(createUserSchema), register);


/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: Login an existing user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       "200":
 *         description: Login successful. Authentication cookies are set
 *         headers:
 *          Set-cookie:
 *            description:
 *              Sets the authentication cookies.
 *              HttpOnly cookies are not accessible to javeScript.
 *            schema:
 *              type: string
 *              example: "accessToken=...; HttpOnly; Path=/ SameSite=Lax"
 * 
 *       "401":
 *         description: Wrong email or password
 *       "429":
 *         description: Too many login attempts from this IP. Please try again after 15 minutes.
 */

router.post("/login" , loginRateLimiter , validate(loginSchema) , login);
router.post("/refresh" , auth_refresh);
router.patch("/change_password" , authenticate , validate(changePasswordSchema) ,  change_password);

export default router;