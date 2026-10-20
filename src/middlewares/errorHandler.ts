import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

type PrismaKnownRequestError = Error & {
    code: string;
    meta?: Record<string, unknown>;
};

const isPrismaKnownRequestError = (err: unknown): err is PrismaKnownRequestError =>
    err instanceof Error &&
    err.name === "PrismaClientKnownRequestError" &&
    "code" in err &&
    typeof err.code === "string";

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
    if (isPrismaKnownRequestError(err)) {
        const prismaError = err;

        switch (prismaError.code) {

            case "P2002":
                return res.status(409).json({
                    status: "fail",
                    message: "Unique field already exists",
                    field: prismaError.meta?.target,
                });


            case "P2003":
                return res.status(400).json({
                    status: "fail",
                    message: "Referenced record does not exist",
                    field: prismaError.meta?.field_name,
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