import { createLikeSchema } from "../../../validators/likeValidator.js";

describe("createLikeSchema", () => {
    it("should accept valid likeType", () => {
        const result = createLikeSchema.safeParse({
            likeType: "LIKE"
        });
        expect(result.success).toBe(true);
    });

    it("should not accept invalid likeType", () => {
        const result = createLikeSchema.safeParse({
            likeType: "invalid"
        });
        expect(result.success).toBe(false);
    });
});