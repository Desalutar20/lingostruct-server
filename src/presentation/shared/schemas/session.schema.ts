import { Session } from "@/application/abstractions/auth/session.type.js";
import z from "zod";

export const SessionSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.literal(["admin", "regular"]),
  avatarUrl: z.string().nullable(),
}) satisfies z.ZodType<Session>;
