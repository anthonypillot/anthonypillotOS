export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("error", async (error, { event }) => {
    if (event) {
      logger.error(`[${event.path}] Application error:`, error);
    } else {
      logger.error("Application error:", error);
    }
  });
});
