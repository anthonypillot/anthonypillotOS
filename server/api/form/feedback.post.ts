import { type Feedback } from "@/components/form/Feedback.vue";
import { create } from "@/server/services/feedback.service";
import { type FeedbackData } from "@prisma/client";
import { z } from "zod";

export default defineEventHandler(async (event): Promise<FeedbackData> => {
  const body: Readonly<Feedback> = await Object.freeze(readBody(event));

  const schema = z.object({
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    message: z.string().nonempty(),
  });

  try {
    schema.parse(body);
    logger.info("Feedback received:", body);
    setResponseStatus(event, 201);
    return await create(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.errors[0].message,
      });
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal server error",
      });
    }
  }
});
