import { z } from "zod";

export const createCommentSchema = z.object({
    commentBody: z
    .string()
    .trim()
    .min(1 , "comment at least must have one character"),

});

export const updateCommentSchema = z.object({
    commentBody: z
    .string()
    .trim()
    .min(1 , "comment at least must have one character"),
})