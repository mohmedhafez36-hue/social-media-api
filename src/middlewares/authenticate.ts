import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export const authenticate = (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const token = req.cookies.accessToken;
        if(!token){
            throw next(new AppError("Token is missing",401));
        }
        const decode = jwt.verify(
            token,
            process.env.JWT_SECRET!
        );
        if (typeof decode === "string") {
            throw new AppError("Invalid or expired token", 401);
        }
        req.user = decode as JwtPayload & { userId: string };
        next();
    }
    catch(err){
        return next(new AppError("Invalid or expired token",401))
    }
};