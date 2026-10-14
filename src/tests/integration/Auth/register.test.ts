import app from "../../../app.js";
import  request  from "supertest";
import prisma from "../../../config/prisma.js";

describe("POST /register",() => {
    beforeAll(async () => {
        await prisma.user.deleteMany();
    });
    afterAll(async () => {
        await prisma.user.deleteMany();
    });
    it("should create user", async () => {
        const response = await request(app)
            .post("/api/register")
            .send({
                userName: "testuser",
                email: "testuser@example.com",
                password: "password123",
                birthDate: "1990-01-01"
            })
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("message", "User created successfully");
    });
    it("should return 400 if userName is missing", async () => {
        const response = await request(app)
            .post("/api/register")
            .send({
                email: "test@example.com",
                password: "password123",
                birthDate: "1990-01-01"
            })
        expect(response.status).toBe(400);
    });
    it("should return 400 if email is missing", async () => {
        const response = await request(app)
            .post("/api/register")
            .send({
                userName: "testuser",
                password: "password123",
                birthDate: "1990-01-01"
            })
        expect(response.status).toBe(400);
    });
    it("should return 400 if birthDate is missing", async () => {
        const response = await request(app)
            .post("/api/register")
            .send({
                userName: "testuser",
                email: "test@example.com",
                password: "password123",
            })
        expect(response.status).toBe(400);
    });
});