interface ReadyResponse {
  statusCode: number;
  statusMessage: string;
  message: string;
}

export default defineEventHandler(async (event): Promise<ReadyResponse> => {
  return {
    statusCode: 200,
    statusMessage: "OK",
    message: "The server is ready to accept requests",
  };
});
