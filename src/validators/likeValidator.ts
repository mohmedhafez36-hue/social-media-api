import { z } from "zod";

export const createLikeSchema = z.object({
  likeType: z.enum([
    "LOVE",
    "FUNNY",
    "SAD",
    "LIKE",
  ]),
});