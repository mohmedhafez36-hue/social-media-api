import { jest } from "@jest/globals"; // <-- Added import for ESM environments
import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../../src/middlewares/errorHandler.js"; // Adjust path if needed
import { AppError } from "../../../src/utils/AppError.js";
import { Prisma } from "../../../generated/prisma/client.js"; // Adjust path if needed

describe("errorHandler Middleware Unit Tests", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let consoleErrorSpy: any;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any,
        };
        mockNext = jest.fn() as any;

        // Suppress console.error logs during tests to keep terminal output clean
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        // Safety check to ensure it was created before trying to restore
        if (consoleErrorSpy) {
            consoleErrorSpy.mockRestore();
        }
    });

    it("should handle custom AppError correctly", () => {
        const appError = new AppError("Invalid credentials", 400);

        errorHandler(appError, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: appError.status,
            message: "Invalid credentials",
        });
    });

    it("should handle Prisma P2002 (Unique constraint violation) error", () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            {
                code: "P2002",
                clientVersion: "5.0.0",
                meta: { target: ["email"] },
            }
        );

        errorHandler(prismaError, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "fail",
            message: "Unique field already exists",
            field: ["email"],
        });
    });

    it("should handle Prisma P2003 (Foreign key constraint failed) error", () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            "Foreign key constraint failed",
            {
                code: "P2003",
                clientVersion: "5.0.0",
                meta: { field_name: "userId" },
            }
        );

        errorHandler(prismaError, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "fail",
            message: "Referenced record does not exist",
            field: "userId",
        });
    });

    it("should handle Prisma P2025 (Record not found) error", () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            "Record to update not found",
            {
                code: "P2025",
                clientVersion: "5.0.0",
            }
        );

        errorHandler(prismaError, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "fail",
            message: "Record not found",
        });
    });

    it("should handle unhandled/default Prisma error codes with 500 status", () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            "Value too long for column",
            {
                code: "P2000",
                clientVersion: "5.0.0",
            }
        );

        errorHandler(prismaError, mockReq as Request, mockRes as Response, mockNext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(prismaError);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "error",
            message: "Database error",
        });
    });

    it("should handle unknown generic errors with 500 status", () => {
        const genericError = new Error("Unexpected crash or network failure");

        errorHandler(genericError, mockReq as Request, mockRes as Response, mockNext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(genericError);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "error",
            message: "Something went wrong",
        });
    });
});