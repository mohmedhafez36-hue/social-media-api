// src/tests/integration/post/update-post.test.ts
import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { generateAccessToken } from "../../../utils/jwt.js"; // Adjust import path if needed

describe("PATCH /api/posts/:id", () => {
    let ownerUserId: string;
    let otherUserId: string;
    let adminUserId: string;

    let ownerCookie: string = "";
    let otherCookie: string = "";
    let adminCookie: string = "";

    let testPostId: string;

    const csrfToken = crypto.randomUUID();

    const POSTS_BASE_URL = "/api/posts";

    beforeEach(async () => {
        // 1. Create Owner User
        const owner = await prisma.user.create({
            data: {
                userName: `owner_${Date.now()}`,
                email: `owner_${Date.now()}@example.com`,
                password: "hashed_password_placeholder",
                birthDate: new Date("2000-01-01"),
                role: "USER",
            },
        });
        ownerUserId = owner.userId;

        // 2. Create Non-Owner User
        const otherUser = await prisma.user.create({
            data: {
                userName: `other_${Date.now()}`,
                email: `other_${Date.now()}@example.com`,
                password: "hashed_password_placeholder",
                birthDate: new Date("2000-01-01"),
                role: "USER",
            },
        });
        otherUserId = otherUser.userId;

        // 3. Create Admin User
        const adminUser = await prisma.user.create({
            data: {
                userName: `admin_${Date.now()}`,
                email: `admin_${Date.now()}@example.com`,
                password: "hashed_password_placeholder",
                birthDate: new Date("2000-01-01"),
                role: "ADMIN",
            },
        });
        adminUserId = adminUser.userId;

        // 4. Create Test Post
        const post = await prisma.post.create({
            data: {
                title: "Original Post Title",
                postBody: "Original Post Body Content",
                userId: ownerUserId,
            },
        });
        testPostId = post.postId;

        // 5. Generate Auth Tokens directly (Bypasses /api/login and rate limits)
        const ownerToken = generateAccessToken(ownerUserId, "USER");
        const otherToken = generateAccessToken(otherUserId, "USER");
        const adminToken = generateAccessToken(adminUserId, "ADMIN");

        ownerCookie = `accessToken=${ownerToken}`;
        otherCookie = `accessToken=${otherToken}`;
        adminCookie = `accessToken=${adminToken}`;
    });

    afterEach(async () => {
        await prisma.post.deleteMany({
            where: { postId: testPostId },
        });
        await prisma.user.deleteMany({
            where: {
                userId: { in: [ownerUserId, otherUserId, adminUserId] },
            },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should allow the post owner to update their post successfully", async () => {
        const updatePayload = {
            title: "Updated Title by Owner",
            postBody: "Updated Body Content by Owner",
        };

        const response = await request(app)
            .patch(`${POSTS_BASE_URL}/${testPostId}`)
            .set("Cookie", [ownerCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
            .send(updatePayload);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");

        const dbPost = await prisma.post.findUnique({
            where: { postId: testPostId },
        });

        expect(dbPost?.title).toBe(updatePayload.title);
        expect(dbPost?.postBody).toBe(updatePayload.postBody);
    });

    it("should allow an ADMIN to update any user's post", async () => {
        const updatePayload = {
            title: "Updated Title by Admin",
            postBody: "Updated Body Content by Admin",
        };

        const response = await request(app)
            .patch(`${POSTS_BASE_URL}/${testPostId}`)
            .set("Cookie", [adminCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
            .send(updatePayload);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");

        const dbPost = await prisma.post.findUnique({
            where: { postId: testPostId },
        });

        expect(dbPost?.title).toBe(updatePayload.title);
    });

    it("should return 403 when a non-owner non-admin user attempts to update the post", async () => {
        const response = await request(app)
            .patch(`${POSTS_BASE_URL}/${testPostId}`)
            .set("Cookie", [otherCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
            .send({
                title: "Unauthorized Edit Attempt",
                postBody: "Should fail",
            });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("You are not authorized to update this post");

        const dbPost = await prisma.post.findUnique({
            where: { postId: testPostId },
        });

        expect(dbPost?.title).toBe("Original Post Title");
    });

    it("should return 401 when the request is unauthenticated", async () => {
        const response = await request(app)
            .patch(`${POSTS_BASE_URL}/${testPostId}`)
            .send({
                title: "Unauthenticated Edit Attempt",
                postBody: "Should fail",
            });

        expect(response.status).toBe(401);
    });
});