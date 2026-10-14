import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/password.js";

describe("PATCH /api/users/profile", () => {
    let userId: string;
    let cookies: string[] = [];
    let accessCookie: string = "";
    const csrfToken = crypto.randomUUID();

    const userPassword = "Password123!";

    // Adjust this path if your profile router is mounted elsewhere (e.g., "/api/profile")
    const UPDATE_PROFILE_URL = "/api/users/profile";

    beforeEach(async () => {
        const passwordHash = await hashPassword(userPassword);

        const user = await prisma.user.create({
            data: {
                userName: `test_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: passwordHash,
                birthDate: new Date("2000-01-01"),
            },
        });

        userId = user.userId;

        // Login to acquire the session / authentication cookie
        const loginResponse = await request(app)
            .post("/api/login")
            .send({
                email: user.email,
                password: userPassword,
            });

        expect(loginResponse.status).toBe(200);

        const rawCookies = loginResponse.headers["set-cookie"];
        cookies = Array.isArray(rawCookies)
            ? rawCookies
            : typeof rawCookies === "string"
            ? [rawCookies]
            : [];

        accessCookie = cookies.find((cookie) => cookie.startsWith("accessToken")) ?? "";
    });

    afterEach(async () => {
        await prisma.user.deleteMany({
            where: { userId },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should update user profile successfully", async () => {
        const updateData = {
            userName: `updated_${Date.now()}`,
            email: `updated_${Date.now()}@example.com`,
        };

        const response = await request(app)
            .patch(UPDATE_PROFILE_URL)
            .set("Cookie" ,[accessCookie, `csrfToken=${csrfToken}`] )
            .set("X-CSRF-Token", csrfToken)
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toMatchObject({
            userName: updateData.userName,
            email: updateData.email,
        });

        // Verify the updates in the database
        const dbUser = await prisma.user.findUnique({
            where: { userId },
        });

        expect(dbUser?.userName).toBe(updateData.userName);
        expect(dbUser?.email).toBe(updateData.email);
    });

    it("should return 401 when the request is unauthenticated", async () => {
        const response = await request(app)
            .patch(UPDATE_PROFILE_URL)
            .send({
                userName: "unauthorized_update",
                email: "unauthorized@example.com",
            });

        expect(response.status).toBe(401);
    });

    it("should return error when the user is deleted before updating", async () => {
        // Delete user to trigger a Prisma record-not-found error
        await prisma.user.delete({
            where: { userId },
        });

        const response = await request(app)
            .patch(UPDATE_PROFILE_URL)
            .set("Cookie", accessCookie.length > 0 ? [accessCookie] : cookies)
            .send({
                userName: "ghost_user",
                email: "ghost@example.com",
            });

        expect(response.status).toBeGreaterThanOrEqual(400);
    });
});