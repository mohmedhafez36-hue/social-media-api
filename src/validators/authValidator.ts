import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
}); 

export const createUserSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  birthDate: z.coerce
  .date({
    message: "Invalid birth date",
  })
  .refine(
    (date) => date <= new Date(),
    {
      message: "Birth date cannot be in the future",
    }
  ),
});

export const updateUserSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional(),
})
  .refine(
    (data) => data.userName !== undefined || data.email !== undefined,
    {
      message: "At least on feild must be provided"
    }
);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
}); 

export const  changePasswordSchema = z.object({
  password:z
    .string()
    .min(8, "Password must be at least 8 characters"),
  newPassword: z  
    .string()
    .min(8, "Password must be at least 8 characters"),
})