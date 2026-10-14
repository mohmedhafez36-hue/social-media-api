import { email } from "zod";
import {createUserSchema,
        updateUserSchema,
        loginSchema
        } from "../../../validators/authValidator.js";

describe("CreateUserSchema" , () =>{
    const birthDate = new Date("2005-09-26")
    it("should accept the valid user", () =>{
        const result = createUserSchema.safeParse({
            userName: "mohamedhafez2323",
            email:"mohamed@gmail.com",
            password:"hafez6969",
            birthDate: birthDate
        });
        expect(result.success).toBe(true);
    });

    it("should not accept the invalid user email" , () => {
        const result = createUserSchema.safeParse({
            userName: "mohamedhafez2323",
            email:"232e4efw", // invalid email
            password:"hafez6969",
            birthDate: birthDate
        });
        expect(result.success).toBe(false);
    });
        it("should not accept the invalid user birth date" , () => {
        const result = createUserSchema.safeParse({
            userName: "mohamedhafez2323",
            email:"hafez@gamil.com", 
            password:"hafez6969",
            birthDate: new Date("2027-09-26") // invalid birth date
        });
        expect(result.success).toBe(false);
    });
            it("should not accept the invalid user password" , () => {
        const result = createUserSchema.safeParse({
            userName: "mohamedhafez2323",
            email:"hafez@gamil.com", 
            password:"123", // invalid password 
            birthDate: birthDate
        });
        expect(result.success).toBe(false);
    });
});

describe("UpdateUserSchema" , () =>{
    it("should accept the valid user" , () => {
        const result = updateUserSchema.safeParse({
            userName: "mohamedhafez2323",
            email:"hafez@gamil.com"
        });
        expect(result.success).toBe(true);
    });
    it("should accept just the userName" , () => {
        const result = updateUserSchema.safeParse({
            userName: "mohamedhafez2323"
        });
        expect(result.success).toBe(true);
    });
    it("should accept just the email" , () => {
        const result = updateUserSchema.safeParse({
            email:"hafez@gamil.com"
        });
        expect(result.success).toBe(true);
    });
});

