import { type Feedback } from "@/components/form/Feedback.vue";
import * as dao from "@/server/dao/feedback.dao";
import { type FeedbackData } from "@prisma/client";

export async function create(feedback: Feedback): Promise<FeedbackData> {
  return await dao.create(feedback);
}
