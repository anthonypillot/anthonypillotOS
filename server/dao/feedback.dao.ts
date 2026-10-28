import type { Feedback } from "@/components/form/Feedback.vue";
import type { FeedbackData } from "#server/generated/prisma/client";
import { createPrismaClient } from "#server/utils/prisma";

const prisma = createPrismaClient();

export async function create(feedback: Feedback): Promise<FeedbackData> {
  try {
    logger.debug("Feedback to create: ", feedback.message);
    return await prisma.feedbackData.create({
      data: feedback,
    });
  } catch (error) {
    const message = "Failed to create feedback\n" + error;
    logger.error(message);
    throw new Error(message, { cause: error });
  }
}
