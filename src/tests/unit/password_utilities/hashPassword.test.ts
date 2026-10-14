import { hashPassword } from "../../../utils/password.js";

describe("hashPassword", () => {
  it("should hash a password correctly", async () => {
    const password = "mySecurePassword";
    const hashedPassword = await hashPassword(password);
    expect(hashedPassword).not.toBe(password);
  });
});