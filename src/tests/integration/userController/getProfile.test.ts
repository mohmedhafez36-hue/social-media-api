import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/password.js";

describe("GET /api/users/profile", () => {
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
                birthDate: new Date("2000-01-01"),
                role: "USER"
            },
        });
        userId = user.userId;
    });
    
    afterEach(async () => {
        await prisma.refreshToken.deleteMany({
            where:{userId}
        });
        await prisma.user.deleteMany({
            where:{userId}
        })
    })

    it("should retrun a profile with authenticated user", async () => {
        const loging = await request(app)
            .post("/api/login")
            .send({email,password});
        expect(loging.status).toBe(200);
        
        const cookies = loging.headers["set-cookie"];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith("accessToken"))
            : typeof cookies === "string" && cookies.startsWith("accessToken")
                ? cookies
                : undefined;

        const response = await request(app)
        .get("/api/users/profile")
        .set("Cookie", accessCookie);

        expect(response.status).toBe(200);
    });
    it("should return 401 for an unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/users/profile");
        expect(response.status).toBe(401);
    });
});