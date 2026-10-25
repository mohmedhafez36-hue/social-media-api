import { Request, Response } from "express";
import { Router } from "express";

const router = Router();

router.get("/", (
    req:Request,
    res:Response
) => {
    res.status(200).json({
        status: "OK",
        timeStamp: new Date().toISOString(),
    });
});

export default router;