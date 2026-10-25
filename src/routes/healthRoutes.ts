import { Router ,Request, Response } from "express";

import prisma from "../config/prisma.js";

const router = Router();

router.get("/health", (
    req: Request,
    res: Response
) => {
    res.status(200).json({
        status: "OK",
        timeStamp: new Date().toISOString(),
    });
});

router.get("/ready", async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: "ready",
            checks: {
                database: "connected",
            },
        });
    } catch (error) {
        console.error("Readiness check failed:", error);

        res.status(503).json({
            status: "not ready",
            checks: {
                database: "unavailable",
            },
        });
    }
});

export default router;