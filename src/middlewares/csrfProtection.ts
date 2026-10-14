import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
export const csrfProtection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const csrfCookie = req.cookies.csrfToken;
    const csrfHeader = req.header("X-CSRF-Token");

    if (!csrfCookie || !csrfHeader) {
        throw new AppError("CSRF Token Missing", 403)
    }

    if(csrfCookie !== csrfHeader ){
        throw new AppError("Forbidden", 403);
    }
    next()
}