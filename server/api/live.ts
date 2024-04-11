interface LiveResponse {
  statusCode: number;
  statusMessage: string;
  message: string;
}

export default defineEventHandler(async (event): Promise<LiveResponse> => {
  return {
    statusCode: 200,
    statusMessage: "OK",
    message: "The server is live",
  };
});
