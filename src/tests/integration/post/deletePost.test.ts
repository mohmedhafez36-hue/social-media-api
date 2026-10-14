import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/password.js";

describe("GET /api/users/profile", () => {
    let adminId: string;
    let adminEmail: string;
    let userId: string;
    let email: string;
    const password = "StrongPass123";
    beforeEach(async () => {
        email = `test-${crypto.randomUUID()}@example.com`;
        adminEmail = `test-${crypto.randomUUID()}@example.com`;
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
        const admin = await prisma.user.create({
            data: {
                userName: `test_${crypto.randomUUID().slice(0, 8)}`,
                email:adminEmail,
                password: hashedPassword,
                birthDate: new Date("2000-01-01"),
                role: "ADMIN"
            }, 
        }); 
        userId = user.userId;
        adminId = admin.userId;
    });
    afterEach(async () => {
        // Delete dependent records before deleting the user.
        await prisma.like.deleteMany({
            where: { userId: { in: [userId, adminId] } },
        });

        await prisma.comment.deleteMany({
            where: { userId: { in: [userId, adminId] } },
        });

        await prisma.post.deleteMany({
            where: { userId: { in: [userId, adminId] } },
        });

        await prisma.refreshToken.deleteMany({
            where: { userId: { in: [userId, adminId] } },
        });

        await prisma.user.deleteMany({
            where: { userId: { in: [userId, adminId] } },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
    const csrfToken = crypto.randomUUID();
    it("should delete the post owned by the authenticated user", async() => {
            const login = await request(app)
            .post("/api/login")
            .send({ email, password });

        expect(login.status).toBe(200);
        const cookies = login.headers["set-cookie"];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith("accessToken"))
            : typeof cookies === "string" && cookies.startsWith("accessToken")
                ? cookies
                : undefined;
        const post = await prisma.post.create({
            data:{
                title: "test delete Post",
                postBody:"test delete Post",
                userId
            },
        });
        const response = await request(app)
        .delete(`/api/posts/${post.postId}`)
        .set("Cookie", [ accessCookie!.split(";")[0],`csrfToken=${csrfToken}`, ]) .set("X-CSRF-Token", csrfToken);    
        expect(response.status).toBe(200);
        
        const deletedPost = await prisma.post.findUnique({
            where:{postId:post.postId}
        });
        expect(deletedPost).toBeNull();
    });

});