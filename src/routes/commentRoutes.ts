import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
    create_comment,
    update_comment,
    delete_comment,
} from "../controllers/commentController.js";

import { validate , validateParams } from "../middlewares/validate.js";
import { createCommentSchema, updateCommentSchema } from "../validators/commnetValidator.js";
import { idParamSchema } from "../validators/authValidator.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
const router = Router();

router.post("/:id" , authenticate , csrfProtection, validate(createCommentSchema) , create_comment);
router.patch("/:id" , authenticate , csrfProtection, validateParams(idParamSchema) , validate(updateCommentSchema) , update_comment);
router.delete("/:id" , authenticate , csrfProtection,    validateParams(idParamSchema), delete_comment);

export default router;