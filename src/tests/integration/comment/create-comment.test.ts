import app from "../../../app.js";
import request from "supertest";
import prisma from "../../../config/prisma.js";
import { generateAccessToken } from "../../../utils/jwt.js";

describe("Comment Controller Integration Tests", () => {
    let postOwnerId: string;
    let commentAuthorId: string;
    let otherUserId: string;
    let adminUserId: string;

    let postOwnerCookie: string;
    let commentAuthorCookie: string;
    let otherUserCookie: string;
    let adminCookie: string;

    let testPostId: string;
    let testCommentId: string;

    const csrfToken = crypto.randomUUID();

    // Adjust this base route to match your router mount path (e.g. "/api/comments")
    const COMMENTS_BASE_URL = "/api/comments";

    beforeEach(async () => {
        // 1. Create Test Users
        const postOwner = await prisma.user.create({
            data: {
                userName: `post_owner_${Date.now()}`,
                email: `post_owner_${Date.now()}@example.com`,
                password: "hashed_password",
                birthDate: new Date("2000-01-01"),
                role: "USER",
            },
        });
        postOwnerId = postOwner.userId;

        const commentAuthor = await prisma.user.create({
            data: {
                userName: `comment_author_${Date.now()}`,
                email: `comment_author_${Date.now()}@example.com`,
                password: "hashed_password",
                birthDate: new Date("2000-01-01"),
                role: "USER",
            },
        });
        commentAuthorId = commentAuthor.userId;

        const otherUser = await prisma.user.create({
            data: {
                userName: `other_user_${Date.now()}`,
                email: `other_user_${Date.now()}@example.com`,
                password: "hashed_password",
                birthDate: new Date("2000-01-01"),
                role: "USER",
            },
        });
        otherUserId = otherUser.userId;

        const adminUser = await prisma.user.create({
            data: {
                userName: `admin_user_${Date.now()}`,
                email: `admin_user_${Date.now()}@example.com`,
                password: "hashed_password",
                birthDate: new Date("2000-01-01"),
                role: "ADMIN",
            },
        });
        adminUserId = adminUser.userId;

        // 2. Create Test Post
        const post = await prisma.post.create({
            data: {
                title: "Test Post for Comments",
                postBody: "Post Body Content",
                userId: postOwnerId,
            },
        });
        testPostId = post.postId;

        // 3. Create Initial Test Comment
        const comment = await prisma.comment.create({
            data: {
                commentBody: "Original comment text",
                postId: testPostId,
                userId: commentAuthorId,
            },
        });
        testCommentId = comment.commentId;

        // 4. Generate Auth Cookies
        postOwnerCookie = `accessToken=${generateAccessToken( postOwnerId, "USER" )}`;
        commentAuthorCookie = `accessToken=${generateAccessToken(commentAuthorId, "USER")}`;
        otherUserCookie = `accessToken=${generateAccessToken(otherUserId, "USER")}`;
        adminCookie = `accessToken=${generateAccessToken(adminUserId, "ADMIN")}`;
    });

    afterEach(async () => {
        // Clean up database entities
        await prisma.comment.deleteMany({
            where: { postId: testPostId },
        });
        await prisma.post.deleteMany({
            where: { postId: testPostId },
        });
        await prisma.user.deleteMany({
            where: {
                userId: { in: [postOwnerId, commentAuthorId, otherUserId, adminUserId] },
            },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    /* ==========================================
       1. POST /:id (create_comment)
    ========================================== */
    describe("POST /api/comments/:id (Create Comment)", () => {
        it("should create a new comment on a post successfully", async () => {
            const payload = { commentBody: "This is a new test comment" };

            const response = await request(app)
                .post(`${COMMENTS_BASE_URL}/${testPostId}`)
            .set("Cookie", [commentAuthorCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                status: "Success",
                message: "Comment created successfully",
            });
            expect(response.body.comment).toHaveProperty("commentId");
            expect(response.body.comment.commentBody).toBe(payload.commentBody);
        });

        it("should return 401 when request is unauthenticated", async () => {
            const response = await request(app)
                .post(`${COMMENTS_BASE_URL}/${testPostId}`)
                .send({ commentBody: "Unauthenticated comment" });

            expect(response.status).toBe(401);
        });
    });

    /* ==========================================
       2. PATCH /:id (update_comment)
    ========================================== */
    describe("PATCH /api/comments/:id (Update Comment)", () => {
        it("should allow the comment author to update their comment", async () => {
            const updatedText = "Updated comment text by author";

            const response = await request(app)
                .patch(`${COMMENTS_BASE_URL}/${testCommentId}`)
            .set("Cookie", [commentAuthorCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken)
                .send({ commentBody: updatedText });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "Success",
                message: "Comment updated successfully",
            });

            // Verify in DB
            const dbComment = await prisma.comment.findUnique({
                where: { commentId: testCommentId },
            });
            expect(dbComment?.commentBody).toBe(updatedText);
        });

        it("should return 401 when a non-author attempts to update the comment", async () => {
            const response = await request(app)
                .patch(`${COMMENTS_BASE_URL}/${testCommentId}`)
                .set("Cookie", [otherUserCookie, `csrfToken=${csrfToken}`])
                .set("X-CSRF-Token", csrfToken)
                .send({ commentBody: "Unauthorized update attempt" });

            expect(response.status).toBe(401);

            // Verify comment in DB remains unchanged
            const dbComment = await prisma.comment.findUnique({
                where: { commentId: testCommentId },
            });
            expect(dbComment?.commentBody).toBe("Original comment text");
        });

        it("should return 401 when request is unauthenticated", async () => {
            const response = await request(app)
                .patch(`${COMMENTS_BASE_URL}/${testCommentId}`)
                .send({ commentBody: "Unauthenticated edit" });

            expect(response.status).toBe(401);
        });
    });

    /* ==========================================
       3. DELETE /:id (delete_comment)
    ========================================== */
    describe("DELETE /api/comments/:id (Delete Comment)", () => {
        it("should allow the comment author to delete their comment", async () => {
            const response = await request(app)
                .delete(`${COMMENTS_BASE_URL}/${testCommentId}`)
                .set("Cookie", [commentAuthorCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "Success",
                message: "Comment deleted successfully",
            });

            const dbComment = await prisma.comment.findUnique({
                where: { commentId: testCommentId },
            });
            expect(dbComment).toBeNull();
        });

        it("should allow the post owner to delete comments on their post", async () => {
            const response = await request(app)
                .delete(`${COMMENTS_BASE_URL}/${testCommentId}`)
                .set("Cookie", [postOwnerCookie, `csrfToken=${csrfToken}`])
                .set("X-CSRF-Token", csrfToken);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "Success",
                message: "Comment deleted successfully",
            });
        });

        it("should allow an ADMIN to delete any comment", async () => {
            const response = await request(app)
                .delete(`${COMMENTS_BASE_URL}/${testCommentId}`)
                .set("Cookie", [adminCookie, `csrfToken=${csrfToken}`])
                .set("X-CSRF-Token", csrfToken);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "Success",
                message: "Comment deleted successfully",
            });
        });

        it("should return 401 when a non-author non-post-owner non-admin user attempts to delete", async () => {
            const response = await request(app)
            .delete(`${COMMENTS_BASE_URL}/${testCommentId}`)
            .set("Cookie", [otherUserCookie, `csrfToken=${csrfToken}`])
            .set("X-CSRF-Token", csrfToken);

            expect(response.status).toBe(401);

            // Ensure comment was not deleted from DB
            const dbComment = await prisma.comment.findUnique({
                where: { commentId: testCommentId },
            });
            expect(dbComment).not.toBeNull();
        });

        it("should return 401 when request is unauthenticated", async () => {
            const response = await request(app)
                .delete(`${COMMENTS_BASE_URL}/${testCommentId}`);

            expect(response.status).toBe(401);
        });
    });
});