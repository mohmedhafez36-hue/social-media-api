import {comparePassword} from "../../../utils/password.js";
import { hashPassword } from "../../../utils/password.js";

describe("Compare Password" ,()  => {
    const password = "12334";
    it("should return true for correct password",async () => {
        const hashedPassword = await hashPassword(password);
        const result = await comparePassword(password , hashedPassword);
        expect(result).toBe(true);
    });

    it("should retrun false for the wrong password" , async() => {
        const hashedPassword = await hashPassword("wrongPassword");
        const result = await comparePassword(password , hashedPassword );
        expect(result).toBe(false);
    });
})