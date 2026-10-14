import { createPostSchema , updatePostSchema } from "../../../validators/postValidator.js"; 

describe("createPostSchema" , () => {
    it("should accept valid post", () => {
        const result = createPostSchema.safeParse({
            title:"FC Barcalona",
            postBody:"Barcalona is the most strongest team."
        });
        expect(result.success).toBe(true);
    });

    it("should not accept the invalid post body", () => {
        const result = createPostSchema.safeParse({
            title:"FC Barcalona",
            postBody:124314 //invalid post body number
        });
        expect(result.success).toBe(false);
    });

    it("should not accept the invalid post body", () => {
        const result = createPostSchema.safeParse({
            title:"FC Barcalona",
            postBody:"" //invalid post body : post body is required
        });
        expect(result.success).toBe(false);
    });

    it("should not accept the invalid title", () => {
        const result = createPostSchema.safeParse({
            title:1234, //invalid title number
            postBody:"Barcalona is the most strongest team."
        });
        expect(result.success).toBe(false);
    })

    it("should not accept the invalid title", () => {
        const result = createPostSchema.safeParse({
            title:"AB", //invalid title : too short
            postBody:"Barcalona is the most strongest team."
        });
        expect(result.success).toBe(false);
    });
});

describe("updatePostSchema" , () => {
    it("should accept valid post updates", () => {
        const result = updatePostSchema.safeParse({
            title:"Im the one who knocks.",
            postBody:"who said this title is Hisenberge"
        });
        expect(result.success).toBe(true);
    });
    it("should accept one or two fields of the post updated ", () => {
        const result = updatePostSchema.safeParse({
            title:"Im the one who knocks."
        });
        expect(result.success).toBe(true);
    });
    it("should not accept the invalid post body", () => {
        const result = updatePostSchema.safeParse({
            title:"Im the one who knocks.",
            postBody:124314 //invalid post body
        });
        expect(result.success).toBe(false);
    });
    it("should not acccept if the tow fields are empty", () => {
        const result = updatePostSchema.safeParse({
            
        });
        expect(result.success).toBe(false);
    });
});