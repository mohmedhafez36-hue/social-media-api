import { z } from "zod";

export const createPostSchema = z.object({
    title: z
    .string("title must be string")
    .trim()
    .min(3 , "Title must be at least 3 characters")
    .max(150 , "Title must be at most 150 characters"),

    postBody: z
    .string()
    .trim()
    .min(1, "Post body is required")
    .max(5000, "Post body must be at most 5000 characters"),

});

export const updatePostSchema = z
    .object({
    title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must be at most 150 characters")
        .optional(),

    postBody: z
        .string()
        .trim()
        .min(1, "Post body cannot be empty")
        .max(5000, "Post body must be at most 5000 characters")
        .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.postBody !== undefined,
    {
      message: "At least one field must be provided.",
    }
  );