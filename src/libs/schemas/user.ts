import { z } from "zod";

export const userSchema = z.object({
  avatar: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  created: z.string(),
  email: z.string(),
  emailVisibility: z.boolean(),
  id: z.string(),
  name: z.string(),
  updated: z.string(),
  username: z.string(),
  verified: z.boolean(),
});
