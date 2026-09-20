import { create } from "@@/server/services/feedback.service";
import type { FeedbackData } from "@prisma/client";
import { z } from "zod";

export default defineEventHandler(async (event): Promise<FeedbackData> => {
  const schema = z.object({
    name: z.string().nonempty({ message: "Name cannot be empty" }).optional(),
    email: z.email().optional(),
    message: z.string().nonempty({ message: "Message cannot be empty" }),
  });

  const body = await readBody(event);

  try {
    const { name, email, message } = schema.parse(body);
    setResponseStatus(event, 201);
    return await create({ name, email, message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad request",
        message: error.issues.map((issue) => issue.message).join(", "),
      });
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal server error",
      });
    }
  }
});
