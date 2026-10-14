import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import {
    get_profile,
    update_profile,
    delete_user,
    get_all_users,
} from "../controllers/userController.js";


const router = Router();

router.get("/allUsers" , authenticate , authorize("ADMIN") , get_all_users);

router.get("/profile" , authenticate , get_profile);

router.patch("/profile" , authenticate, csrfProtection, update_profile);

router.delete("/:id" , authenticate, csrfProtection, authorize("ADMIN") , delete_user);

export default router;