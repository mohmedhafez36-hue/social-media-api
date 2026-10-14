import { describe } from "node:test";
import { generateAccessToken, generateRefreshToken } from "../../../utils/jwt.js"
import jwt from "jsonwebtoken";

describe("generateAccessToken", () => {
    it("should generate token correctly", () => {
        const userId = "123"
        const userRole = "user"
        const result = generateAccessToken(userId,userRole);
        const decoded = jwt.verify(result, process.env.JWT_SECRET!);

        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
        expect(decoded).toEqual({ userId, iat: expect.any(Number), exp: expect.any(Number), role: userRole });
    });
});

describe("generateRefreshToken", () => {
    it("should generate token correctly", () => {
        const result = generateRefreshToken();
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
    });
});
