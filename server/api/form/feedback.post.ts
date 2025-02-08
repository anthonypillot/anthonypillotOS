import { type Feedback } from "@/components/form/Feedback.vue";
import { create } from "@/server/services/feedback.service";
import { type FeedbackData } from "@prisma/client";
import { z } from "zod";

export default defineEventHandler(async (event): Promise<FeedbackData> => {
  const schema = z.object({
    name: z.nullable(z.string().nonempty({ message: "Name cannot be empty" })),
    email: z.nullable(z.string().email()),
    message: z.string().nonempty({ message: "Message cannot be empty" }),
  });

  const body: Feedback = await readBody<Feedback>(event);

  try {
    schema.parse(body);
    setResponseStatus(event, 201);
    return await create(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad request",
        message: error.errors.map((error) => error.message).join(", "),
      });
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal server error",
      });
    }
  }
});
