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
        // Delete dependent records before deleting the user.
        await prisma.like.deleteMany({
            where: { post: { userId } },
        });

        await prisma.comment.deleteMany({
            where: { post: { userId } },
        });

        await prisma.post.deleteMany({
            where: { userId },
        });

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

    const csrfToken = crypto.randomUUID();
    it("should create a post with authenticated user", async () => {
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

        expect(accessCookie).toBeDefined();
        const response = await request(app)
            .post("/api/posts")
            .set("Cookie",[accessCookie , `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
            .send({
                title: "This is a title test post.",
                postBody: "This is the body of the test post.",
                userId: userId
            });
        expect(response.status).toBe(201);
        expect(response.body.data.post.title).toBe("This is a title test post.");
        expect(response.body.data.post.postBody).toBe("This is the body of the test post.");

        const post = await prisma.post.findUnique({
            where: { 
                postId:response.body.data.post.postId
            },
        });
        expect(post).not.toBeNull();
    });
    it("should return 401 with unauthenticate user", async () => {
        const response = await request(app)
            .post("/api/posts")
            .send({
                title:"test title",
                "postBody": "test body"
            });
        expect(response.status).toBe(401);    
    });
});