import prisma from '../config/prisma.js';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/jwt.js';


export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userName, email, password, birthDate , role} = req.body;
        const date = new Date(birthDate)

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if (existingUser) {
            throw next(new AppError("Email already exists", 409));
        }
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                userName,
                email,
                password: hashedPassword,
                birthDate: date,
                role,
            }
        });
        res.status(201).json({
            message: "User created successfully",
            user: {
                userName: user.userName,
                email: user.email,
                role: user.role,
                birthDate: user.birthDate
            }
        });
    }
    catch (err) {
        next(err)
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw next(new AppError("Wrong email or password", 401));
        }
        const isValidPassword = await comparePassword(
            password,
            user.password
        );
        if (!isValidPassword) {
            throw next(new AppError("Wrong email or password", 401));
        }
        const accessToken = generateAccessToken(user.userId, user.role);
        const refreshToken = generateRefreshToken();
        const tokenHash = hashToken(refreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7)
        await prisma.refreshToken.create({
            data: {
                tokenHash,
                expiresAt,
                userId: user.userId
            }
        })
        const csrfToken = crypto.randomUUID();
        res.cookie("csrfToken" , csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 
        })
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000 // default 100 minutes
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "login successfully",
        });
    }
    catch (err) {
        next(err)
    }
};

export const auth_refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            throw new AppError("Refresh Token Is Required", 401);
        }
        const tokenHash = hashToken(refreshToken);
        const storedToken = await prisma.refreshToken.findUnique({
            where: {
                tokenHash
            },
            include: {
                user: true
            },
        });
        if (!storedToken) {
            throw new AppError("Invalid refresh token", 401);
        }
        if (storedToken.revokedAt) {
            throw new AppError("Refresh token has been revoked", 401);
        }
        if (storedToken.expiresAt < new Date()) {
            throw new AppError("Refresh token has expired", 401);
        }
        const accessToken = generateAccessToken(
            storedToken.user.userId,
            storedToken.user.role
        )
        const newRefreshToken = generateRefreshToken();
        const newHashToken = hashToken(newRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const result = await prisma.$transaction(async (tx: any) => {

            await tx.refreshToken.update({
                where: {
                    id: storedToken.id,
                },
                    data: {
                        revokedAt: new Date(),
                    },
            });

            const newToken = await tx.refreshToken.create({
            data: {
                tokenHash: newHashToken,
                userId: storedToken.user.userId,
                expiresAt,
            },
        });

            return newToken;
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "Token refreshed successfully",
        })
    }
    catch (err) {
        next(err)
    }
};



export const change_password = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = req.user!.userId;
        const { password, newPassword } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                userId,
            },
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        const isValidPassword = await comparePassword(
            password,
            user?.password
        )
        if (!isValidPassword) {
            throw new AppError("Wrong password", 400)
        }
        const newPasswordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: {
                userId,
            },
            data: {
                password: newPasswordHash,
            },
        });
        res.status(200).json({
            status: "Success",
            message: "Password updated successfully"
        })
    }
    catch (err) {
        next(err)
    }
}