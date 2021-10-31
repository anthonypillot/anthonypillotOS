// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Metadata = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Metadata>
) {
  res.status(200).json({ name: "anthonypillotOS" });
}
