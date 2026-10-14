import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../utils/AppError.js";

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }


    // Prisma
    if (err instanceof Prisma.PrismaClientKnownRequestError) {

        switch (err.code) {

            case "P2002":
                return res.status(409).json({
                    status: "fail",
                    message: "Unique field already exists",
                    field: err.meta?.target,
                });


            case "P2003":
                return res.status(400).json({
                    status: "fail",
                    message: "Referenced record does not exist",
                    field: err.meta?.field_name,
                });


            case "P2025":
                return res.status(404).json({
                    status: "fail",
                    message: "Record not found",
                });


            default:
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Database error",
                });
        }
    }


    // Unknown error
    console.error(err);

    return res.status(500).json({
        status: "error",
        message: "Something went wrong",
    });
};