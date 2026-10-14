import { Request, Response, NextFunction } from "express";
import {AppError} from "../utils/AppError";

export const authorize = (...allowedRoles: string[]) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        if (!req.user) {
            throw new AppError("Authentication required", 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("Forbidden" , 403);
        }
        next();
    };
};