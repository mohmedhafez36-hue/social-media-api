import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashToken } from "../../../utils/jwt.js"

describe("POST /api/refresh", () => {
    let userId: string;
    beforeEach(async () => {
        const user = await prisma.user.create({
            data: {
                userName: "testUser",
                email: "testUser123@gmail.com",
                password: "hashed-test-password",
                "birthDate": new Date("2005-9-27"),
            },
        });
        userId = user.userId;
    });
    afterEach(async () => {
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
        await prisma.user.deleteMany({
            where: { userId },
        });
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("should reject a request without a refresh token", async () => {
        const response = await request(app)
            .post("/api/refresh");

        expect(response.status).toBe(401);
    });
    it("should reject an invalid refresh token", async () => {
        const response = await request(app)
            .post("/api/refresh")
            .set("Cookie", "refreshToken=invalid-token");

        expect(response.status).toBe(401);
    });
    it("should reject a revoked refresh token", async () => {
        const rawToken = "revoked-test-token";

        await prisma.refreshToken.create({
            data: {
                tokenHash: hashToken(rawToken),
                userId,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                revokedAt: new Date(),
            },
        });

        const response = await request(app)
            .post("/api/refresh")
            .set("Cookie", `refreshToken=${rawToken}`);

        expect(response.status).toBe(401);
    });
    it("should reject an expired token", async () => {
        const rawToken = "expired-test-token";

        await prisma.refreshToken.create({
            data:{
                tokenHash: hashToken(rawToken),
                userId,
                expiresAt: new Date(),
                revokedAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        const response = await request(app)
            .post("/api/refresh")
            .set("Cookie", `refreshToken=${rawToken}`);
        expect(response.status).toBe(401);
    });

    it("should rotate a valid refresh token", async () => {
        const rawToken = "valid-test-token";

        const oldToken = await prisma.refreshToken.create({
            data:{
                tokenHash: hashToken(rawToken),
                userId,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        const response = await request(app)
            .post("/api/refresh")
            .set("Cookie", `refreshToken=${rawToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Token refreshed successfully");

        const setCookieHeader = response.headers["set-cookie"];
        const cookies = typeof setCookieHeader === "string"
            ? [setCookieHeader]
            : setCookieHeader ?? [];

        expect(
            cookies.some((cookie) => cookie.startsWith("accessToken="))
        ).toBe(true);
        expect(
            cookies.some((cookie) => cookie.startsWith("refreshToken="))
        ).toBe(true);
        const updatedOldToken = await prisma.refreshToken.findUnique({
            where: { id: oldToken.id },
        });

        expect(updatedOldToken?.revokedAt).not.toBeNull();

        const allTokens = await prisma.refreshToken.findMany({
            where: { userId },
        });

        expect(allTokens).toHaveLength(2);

        const newToken = allTokens.find(
        (token: any) => token.id !== oldToken.id
        );

    expect(newToken).toBeDefined();
    expect(newToken?.revokedAt).toBeNull();
    expect(newToken?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
});


