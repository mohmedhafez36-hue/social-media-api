import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword, comparePassword } from "../../../utils/password.js";

describe("POST /api/change-password", () => {
    let userId: string;
    let cookies: string[] = [];
    let accessCookie: string = "";

    const oldPassword = "OldPassword123!";
    const newPassword = "NewPassword456!";

    const CHANGE_PASSWORD_URL = "/api/change_password"; 

    beforeEach(async () => {
        const passwordHash = await hashPassword(oldPassword);

        const user = await prisma.user.create({
            data: {
                userName: `test_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: passwordHash,
                birthDate: new Date("2000-01-01"),
            },
        });

        userId = user.userId;

        const loginResponse = await request(app)
            .post("/api/login") // Ensure this path matches your auth mount as well (e.g., /api/auth/login)
            .send({
                email: user.email,
                password: oldPassword,
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

    // Clean up Prisma connection to allow Jest to exit cleanly
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should change the password successfully", async () => {
        const response = await request(app)
            .patch(CHANGE_PASSWORD_URL)
            .set("Cookie", accessCookie)
            .send({
                password: oldPassword,
                newPassword,
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "Success",
            message: "Password updated successfully",
        });

        const updatedUser = await prisma.user.findUnique({
            where: { userId },
        });

        expect(updatedUser).not.toBeNull();
        expect(await comparePassword(newPassword, updatedUser!.password)).toBe(true);
        expect(await comparePassword(oldPassword, updatedUser!.password)).toBe(false);
    });

    it("should return 400 when the old password is incorrect", async () => {
        const response = await request(app)
            .patch(CHANGE_PASSWORD_URL)
            .set("Cookie", accessCookie)
            .send({
                password: "WrongPassword123!",
                newPassword,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Wrong password");

        const user = await prisma.user.findUnique({
            where: { userId },
        });

        expect(await comparePassword(oldPassword, user!.password)).toBe(true);
    });

    it("should return 401 when the user is not authenticated", async () => {
        const response = await request(app)
            .patch(CHANGE_PASSWORD_URL)
            .send({
                password: oldPassword,
                newPassword,
            });

        expect(response.status).toBe(401);
    });

    it("should return 404 when the authenticated user does not exist", async () => {
        await prisma.user.delete({
            where: { userId },
        });

        const response = await request(app)
            .patch(CHANGE_PASSWORD_URL)
            .set("Cookie", accessCookie)
            .send({
                password: oldPassword,
                newPassword,
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("User not found");
    });
});