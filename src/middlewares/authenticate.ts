import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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
        req.user = decode;
        next();
    }
    catch(err){
        return next(new AppError("Invalid or expired token",401))
    }
};