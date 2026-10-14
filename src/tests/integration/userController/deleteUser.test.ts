import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/password.js";
import { randomUUID } from "crypto";

describe("DELETE /api/users/:userId", () => {
    let adminUserId: string;
    let adminEmail: string;
    const adminPassword = "AdminPass123";
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
            }
        });
        userId = user.userId;
        adminEmail = `test-admin-${crypto.randomUUID()}@example.com`;
        const admin = await prisma.user.create({
            data: {
                userName: `admin_${crypto.randomUUID().slice(0, 8)}`,
                email: adminEmail,
                password: await hashPassword(adminPassword),
                birthDate: new Date("1980-01-01"),
                role: "ADMIN"
            }
        });
        adminUserId = admin.userId;
    });
    afterEach(async () => {
        await prisma.refreshToken.deleteMany({
            where: { userId: { in: [userId, adminUserId] } },
        });
        await prisma.user.deleteMany({
            where: { userId: { in: [userId, adminUserId] } },
        });
    });
    
    it("should return 200 and delete the user for an authenticated admin", async () => {
        const loginResponse = await request(app)
            .post("/api/login")
            .send({ email: adminEmail, password: adminPassword });
        expect(loginResponse.status).toBe(200);

        const cookies = loginResponse.headers["set-cookie"];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith("accessToken"))
            : typeof cookies === "string" && cookies.startsWith("accessToken")
                ? cookies
                : undefined;
        const csrfToken = crypto.randomUUID();
        const response = await request(app)
            .delete(`/api/users/${userId}`)
            .set("Cookie", [accessCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("User deleted successfully");
        const deletedUser = await prisma.user.findUnique({
            where: { userId },
        });
        expect(deletedUser).toBeNull();
    });
    
    it("should return 403 for an authenticated non-admin user", async () => {
        const loginResponse = await request(app)
            .post("/api/login")
            .send({ email, password });
        expect(loginResponse.status).toBe(200);
        const cookies = loginResponse.headers["set-cookie"];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith("accessToken"))
            : typeof cookies === "string" && cookies.startsWith("accessToken")
                ? cookies
                : undefined;
        const csrfToken = crypto.randomUUID();
        const response = await request(app)
            .delete(`/api/users/${userId}`)
            .set("Cookie", [accessCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken);
        expect(response.status).toBe(403);
    });

    it("should reject a request without authentication", async () => {
        const csrfToken = randomUUID();

        const response = await request(app)
            .delete(`/api/users/${userId}`)
            .set("Cookie", `csrfToken=${csrfToken}`)
            .set("X-CSRF-Token", csrfToken);

        expect(response.status).toBe(401);
    });

     it("should reject a request without CSRF tokens", async () => {
        const loginResponse = await request(app)
            .post("/api/login")
            .send({ email: adminEmail, password: adminPassword });
        expect(loginResponse.status).toBe(200);

        const cookies = loginResponse.headers["set-cookie"];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith("accessToken"))
            : typeof cookies === "string" && cookies.startsWith("accessToken")
                ? cookies
                : undefined;

    const response = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Cookie", accessCookie ?? "");

    expect(response.status).toBe(403);
  });
});