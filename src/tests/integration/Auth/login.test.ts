
import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/password.js";

describe("POST /api/login", () => {
    let userId: string;
    let email: string;
    const password = "StrongPass123";

    beforeEach(async () => {
        email = `test-${crypto.randomUUID()}@example.com`;

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                userName: `test_${crypto.randomUUID().slice(0, 8)}`,
                email,
                password: hashedPassword,
                birthDate: new Date("2005-09-27"),
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

    it("should login user with valid credentials", async () => {
        const response = await request(app)
            .post("/api/login")
            .send({
                email,
                password,
            });

        expect(response.status).toBe(200);

        const rawCookies = response.headers["set-cookie"];
        const cookies = Array.isArray(rawCookies)
            ? rawCookies
            : rawCookies
                ? [rawCookies]
                : [];

        expect(
            cookies.some((cookie) => cookie.startsWith("accessToken="))
        ).toBe(true);

        expect(
            cookies.some((cookie) => cookie.startsWith("refreshToken="))
        ).toBe(true);
    });

    it("should reject an empty email", async () => {
        const response = await request(app)
            .post("/api/login")
            .send({
                email: "",
                password,
            });

        expect(response.status).toBe(400);
    });

    it("should reject an incorrect password", async () => {
        const response = await request(app)
            .post("/api/login")
            .send({
                email,
                password: "WrongPassword123",
            });

        expect(response.status).toBe(401);
    });
});