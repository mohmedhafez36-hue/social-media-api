import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import {
    create_post,
    update_post,
    delete_post,
} from "../controllers/postController.js";

import { validate , validateParams } from "../middlewares/validate.js";
import { createPostSchema, updatePostSchema } from "../validators/postValidator.js";
import {idParamSchema} from "../validators/authValidator.js";

const router = Router();

router.post("/", authenticate, csrfProtection, validate(createPostSchema), create_post);
router.patch("/:id" , authenticate, csrfProtection, validateParams(idParamSchema) , validate(updatePostSchema) , update_post);
router.delete("/:id" , authenticate, csrfProtection, validateParams(idParamSchema) , delete_post);

export default router;